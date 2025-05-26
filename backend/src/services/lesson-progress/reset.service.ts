// src/services/lesson-progress/reset.service.ts
import { PrismaClient } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from '../../utils/cache.utils';
import redis from '../../config/redis';
import { ClearDashboardCache } from '../../utils/clear_cache.utils';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to reset all lesson progress and quiz attempts for a user on a specific course
 * @param userId - The ID of the user whose progress will be reset
 * @param courseSlug - The slug of the course to reset progress for
 * @returns Object with counts of deleted records
 */
export const resetUserCourseProgress = async (
  userId: number,
  courseSlug: string
): Promise<{ 
  deletedLessonProgress: number, 
  deletedQuizAttempts: number,
  resetEnrollment: boolean 
}> => {
  try {
    // Verify user exists
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Find the course by slug
    const course = await prisma.courses.findUnique({
      where: { slug: courseSlug },
      select: {
        id: true,
        modules: {
          select: {
            id: true,
            order_position:true,
            lessons: {
              select: {
                id: true,
                content_type: true,
                order_position:true
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new AppError(404, 'Course not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        user_id_course_id: { 
          user_id: userId, 
          course_id: course.id 
        }
      }
    });

    if (!enrollment) {
      throw new AppError(404, 'User is not enrolled in this course');
    }

    // Get all lesson IDs from the course
    const lessonIds = course.modules.flatMap(module => 
      module.lessons.map(lesson => lesson.id)
    );

    // Get all quiz IDs from the course
    const quizLessons = course.modules.flatMap(module => 
      module.lessons.filter(lesson => lesson.content_type === 'quiz')
    );
    
    // Find quiz IDs associated with these lessons
    const quizIds = await prisma.quizzes.findMany({
      where: {
        lessons: {
          some: {
            id: {
              in: quizLessons.map(lesson => lesson.id)
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete lesson progress
      const deletedLessonProgress = await tx.lesson_progress.deleteMany({
        where: {
          user_id: userId,
          lesson_id: {
            in: lessonIds
          }
        }
      });

      // 2. Delete quiz attempts
      const deletedQuizAttempts = await tx.quiz_attempts.deleteMany({
        where: {
          user_id: userId,
          quiz_id: {
            in: quizIds.map(quiz => quiz.id)
          }
        }
      });

      // 3. Reset enrollment progress
      const firstModule = course.modules.find((m)=>m.order_position === 1);
      const firstLesson = firstModule?.lessons.find((l)=>l.order_position === 1);
      const updatedEnrollment = await tx.enrollments.update({
        where: {
          user_id_course_id: { 
            user_id: userId, 
            course_id: course.id 
          }
        },
        data: {
          progress_percent: 0,
          last_accessed_module_id: firstModule ? firstModule.id : null,
          last_accessed_lesson_id: firstLesson ? firstLesson.id : null,
          completed_at: null
        }
      });

      return {
        deletedLessonProgress: deletedLessonProgress.count,
        deletedQuizAttempts: deletedQuizAttempts.count,
        resetEnrollment: !!updatedEnrollment
      };
    });

    // Clear relevant caches
    const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseSlug}`);
    const cacheKeyE = `enrollments:${userId}:*`;
    
    await deleteFromCache(cacheKey);
    
    const keys = await redis.keys(cacheKeyE);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    // Clear dashboard cache for the user
    ClearDashboardCache(userId);

    return result;
  } catch (error) {

    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(500, 'Failed to reset course progress');
  }
};
