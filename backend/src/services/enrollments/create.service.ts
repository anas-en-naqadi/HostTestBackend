import { PrismaClient, enrollments, courses, modules, lessons } from "@prisma/client";
import redis from "../../config/redis";
import { AppError } from "../../middleware/error.middleware";
import {
  deleteFromCache,
  CACHE_KEYS,
  generateCacheKey,
} from "../../utils/cache.utils";
import { ClearDashboardCache } from "../../utils/clear_cache.utils";
import { sendNotification } from "../../utils/notification.utils";

const prisma = new PrismaClient();

interface CourseWithModulesAndLessons extends courses {
  modules: Array<modules & {
    lessons: lessons[];
  }>;
}

interface EnrollmentWithDetails extends enrollments {
  users: {
    full_name: string;
  } | null;
  courses: {
    title: string;
    thumbnail_url: string;
    slug: string;
    user: {
      id: number;
    };
  };
}

/**
 * Generates cache pattern for user enrollments
 */
const getEnrollmentsCachePattern = (userId: number): string =>
  `enrollments:${userId}:*`;

/**
 * Validates course existence and structure
 */
const validateCourse = async (courseId: number): Promise<CourseWithModulesAndLessons> => {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnail_url: true,
      instructor_id: true,
      is_published: true,
      modules: {
        where:{order_position:1},
        select: {
          id: true,
          order_position: true,
          lessons: {
        where:{order_position:1},
            select: {
              id: true,
              order_position: true,
            }
          },
        }
      },
    },
  });

  if (!course) {
    throw new AppError(404, "Course not found");
  }

  if (!course.is_published) {
    throw new AppError(400, "Course is not published and cannot be enrolled in");
  }

  if (!course.modules || course.modules.length === 0) {
    throw new AppError(400, "Course has no modules available");
  }

  const firstModule = course.modules[0];
  if (!firstModule.lessons || firstModule.lessons.length === 0) {
    throw new AppError(400, "Course's first module has no lessons available");
  }

  return course as CourseWithModulesAndLessons;
};

/**
 * Checks if user is already enrolled
 */
const checkExistingEnrollment = async (userId: number, courseId: number): Promise<void> => {
  const existingEnrollment = await prisma.enrollments.findUnique({
    where: { 
      user_id_course_id: { 
        user_id: userId, 
        course_id: courseId 
      } 
    },
  });

  if (existingEnrollment) {
    throw new AppError(400, "User already enrolled in this course");
  }
};

/**
 * Creates the enrollment record
 */
const createEnrollmentRecord = async (
  userId: number,
  courseId: number,
  firstModuleId: number,
  firstLessonId: number
): Promise<enrollments> => {
  return await prisma.enrollments.create({
    data: {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date(),
      progress_percent: 0,
      last_accessed_module_id: firstModuleId,
      last_accessed_lesson_id: firstLessonId,
    },
  });
};

/**
 * Gets enriched enrollment data for notifications
 */
const getEnrichedEnrollment = async (enrollmentId: number): Promise<EnrollmentWithDetails | null> => {
  return await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      users: { 
        select: { 
          full_name: true 
        } 
      },
      courses: {
        select: {
          title: true,
          thumbnail_url: true,
          slug: true,
          user: { 
            select: { 
              id: true 
            } 
          },
        },
      },
    },
  });
};

/**
 * Sends enrollment notification to course instructor
 */
const sendEnrollmentNotification = async (
  enrichedEnrollment: EnrollmentWithDetails,
  enrollingUserId: number
): Promise<void> => {
  if (!enrichedEnrollment.users?.full_name) {
    console.warn('User full name not found for enrollment notification');
    return;
  }

  const notificationDto = {
    title: "New Enrollment",
    user_id: enrichedEnrollment.courses.user.id,
    type: "ENROLLMENT" as const,
    content: `${enrichedEnrollment.users.full_name} just enrolled in <b>${enrichedEnrollment.courses.title}</b>`,
    metadata: {
      thumbnail_url: enrichedEnrollment.courses.thumbnail_url,
      slug: enrichedEnrollment.courses.slug,
      enrolled_user_id: enrollingUserId,
    },
  };

  try {
    await sendNotification(notificationDto, enrollingUserId, "intern");
  } catch (error) {
    console.error('Failed to send enrollment notification:', error);
    // Don't throw error here as enrollment should succeed even if notification fails
  }
};

/**
 * Clears relevant caches after enrollment
 */
const clearEnrollmentCaches = async (userId: number, courseSlug: string): Promise<void> => {
  try {
    // Clear course detail cache
    await deleteFromCache(
      generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseSlug}`)
    );

    // Clear user enrollment caches
    const enrollmentKeys = await redis.keys(getEnrollmentsCachePattern(userId));
    if (enrollmentKeys.length > 0) {
      await redis.del(enrollmentKeys);
    }

    // Clear dashboard cache
    await ClearDashboardCache(userId);
  } catch (error) {
    console.error('Failed to clear caches after enrollment:', error);
    // Don't throw error here as enrollment should succeed even if cache clearing fails
  }
};

/**
 * Creates a new enrollment for a user in a course
 * @param userId - The ID of the user to enroll
 * @param courseId - The ID of the course to enroll in
 * @returns Promise<enrollments> - The created enrollment record
 * @throws AppError - If course not found, user already enrolled, or course structure invalid
 */
export const createEnrollment = async (
  userId: number,
  courseId: number
): Promise<enrollments> => {
  // Input validation
  if (!userId || !courseId || userId <= 0 || courseId <= 0) {
    throw new AppError(400, "Invalid user ID or course ID");
  }

  let createdEnrollment: enrollments;
  let courseData: CourseWithModulesAndLessons;

  try {
    // Use transaction to ensure data consistency
    createdEnrollment = await prisma.$transaction(async (tx) => {
      // 1. Validate course exists and has proper structure
      courseData = await validateCourse(courseId);
      
      // 2. Check if user is already enrolled
      await checkExistingEnrollment(userId, courseId);
      
      // 3. Get first module and lesson for initial progress tracking
      // Ensure we get the FIRST module (lowest order_position)
      const firstModule = courseData.modules[0]!;  // Already ordered by order_position ASC
      const firstLesson = firstModule?.lessons[0]!; // Already ordered by order_position ASC
      
      // 4. Create enrollment record with GUARANTEED first module and lesson
      const enrollment = await createEnrollmentRecord(
        userId,
        courseId,
        firstModule.id,
        firstLesson.id
      );
      
      return enrollment;
    });

    // Post-enrollment tasks (notifications and cache clearing)
    // Run these after the transaction to ensure enrollment is committed
    setImmediate(async () => {
      try {
        const enrichedEnrollment = await getEnrichedEnrollment(createdEnrollment.id);

        if (enrichedEnrollment) {
          // Send notification (non-blocking)
          await sendEnrollmentNotification(enrichedEnrollment, userId);
          
          // Clear caches (non-blocking)
          await clearEnrollmentCaches(userId, courseData.slug);
        }
      } catch (postError) {
        console.error('Error in post-enrollment tasks:', postError);
        // Don't throw here as enrollment was successful
      }
    });

    return createdEnrollment;

  } catch (error) {
    // Re-throw AppErrors as-is
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle Prisma unique constraint violations
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        throw new AppError(400, "User already enrolled in this course");
      }
    }
    
    console.error('Error creating enrollment:', error);
    throw new AppError(500, "Failed to create enrollment");
  }
};