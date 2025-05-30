import prisma from "../../config/prisma";
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, deletePatternFromCache } from "../../utils/cache.utils";
import { lesson_content_type } from "../../types/course.types";
import { sendNotification } from "../../utils/notification.utils";
import { Prisma } from "@prisma/client";

// Helper function to retry a transaction with exponential backoff
async function retryTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        operation,
        {
          maxWait: 5000, // 5s max waiting time during the retry process
          timeout: 30000, // 30s transaction timeout
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        }
      );
    } catch (error) {
      lastError = error;
      console.log(`Transaction attempt ${attempt} failed:`, error);
      
      // Only retry on transaction-specific errors
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || 
          !error.message.includes('Transaction')) {
        throw error; // Don't retry on non-transaction errors
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Max 2s delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError;
}

export const createCourse = async (courseData: CreateCourseDto, userId: number) => {
  try {
    const { modules, ...courseDetails } = courseData;

    // Check if slug already exists (outside transaction to fail early)
    const existingCourse = await prisma.courses.findUnique({
      where: { slug: courseDetails.slug },
    });
    if (existingCourse) {
      throw new AppError(400, "Course with this slug already exists.");
    }

    // Calculate total duration
    const totalDuration = modules.reduce(
      (total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      0
    );

    // Use the retry mechanism for transaction
    const createdCourse = await retryTransaction(async (tx) => {
      // Create the course with default values for required fields
      const newCourse = await tx.courses.create({
        data: {
          ...courseDetails,
          total_duration: totalDuration * 60,
          // Provide default values for required fields if they're missing
          thumbnail_url: courseDetails.thumbnail_url || '',
          intro_video_url: courseDetails.intro_video_url || '',
        },
      });

      // Create modules and their lessons in a more efficient way
      // Process modules sequentially to avoid transaction conflicts
      for (const module of modules) {
        const duration = module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

        // Create the module
        const createdModule = await tx.modules.create({
          data: {
            title: module.title,
            order_position: module.order_position,
            duration,
            course_id: newCourse.id,
          },
        });

        // Create lessons sequentially to maintain order and avoid conflicts
        for (const lesson of module.lessons) {
          await tx.lessons.create({
            data: {
              title: lesson.title,
              content_type: lesson.content_type,
              video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
              lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
              quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
              duration: lesson.duration,
              order_position: lesson.order_position,
              module_id: createdModule.id,
            },
          });
        }
      }

      return newCourse;
    });

    // Log success with the actual course data
    console.log("created_course", createdCourse);
    
    // Invalidate all related caches
    try {
      // Clear user-specific course list caches including instructor's own courses
      await deletePatternFromCache(`${CACHE_KEYS.COURSES}:user-*`);
      
      console.log(`Cache invalidated for all course lists after creating course: ${createdCourse.title}`);
    } catch (cacheError) {
      // Just log cache errors but don't fail the operation
      console.error('Error invalidating cache after course creation:', cacheError);
    }
    
    // Send notification about the new course
    await sendNotification({
      title: 'New Course Available',
      user_id: createdCourse.instructor_id,
      type: 'NEW_COURSE',
      content: `A new course <b>${createdCourse.title}</b> is now open for enrollment!`,
      metadata: { slug: createdCourse.slug, thumbnail_url: createdCourse.thumbnail_url },
    }, userId, "instructor");
    
    return createdCourse;
  } catch (error) {
    console.error("Error creating course:", error);
    
    // Improve error handling with more detailed messages
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle transaction-specific errors
      if (error.message.includes("Transaction")) {
        throw new AppError(500, "Database transaction failed despite retry attempts. This could be due to high database load or connection issues. Please try again in a few moments.");
      }
      
      // Handle constraint violations
      if (error.code === 'P2002') {
        throw new AppError(400, `A course with this ${error.meta?.target || 'attribute'} already exists.`);
      }
      
      // Handle other Prisma errors
      throw new AppError(500, `Database error: ${error.message}`);
    }
    
    // Generic error fallback
    throw new AppError(500, "Error creating course. Please try again later.");
  }
};
