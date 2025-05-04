import { PrismaClient, lesson_progress } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from '../../utils/cache.utils';
import redis from '../../config/redis';
import { ClearDashboardCache } from '../../utils/clear_cache.utils';
const prisma = new PrismaClient();

export const createLessonProgress = async (
  userId: number,
  lessonId: number,
  slug: string,
  completed_at: string,
  status: string = "completed",
): Promise<lesson_progress> => {
  const lessonExists = await prisma.lessons.findUnique({ where: { id: lessonId } });
  if (!lessonExists) throw new Error('Lesson not found');

  const existingProgress = await prisma.lesson_progress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });
  if (existingProgress) throw new Error('Progress already tracked for this lesson');
  
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${slug}`);
  const cacheKeyE = `enrollments:${userId}:*`

  // Get course and modules information
  const course = await prisma.courses.findFirst({
    where: {
      modules: {
        some: {
          lessons: {
            some: {
              id: lessonId
            }
          }
        }
      }
    },
    select: {
      id: true,
      modules: {
        select: {
          id: true,
          lessons: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  if (!course) throw new Error('Course not found');

  // Calculate total lessons in course
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  if (totalLessons === 0) throw new Error('Course has no lessons');

  // Get count of completed lessons for this user in this course
  const completedLessons = await prisma.lesson_progress.count({
    where: {
      user_id: userId,
      lessons: {
        module_id: {
          in: course.modules.map(m => m.id)
        }
      },
      status: 'completed'
    }
  });

  // Calculate new progress percentage
  const newProgressPercent = Math.min(
    Math.round(((completedLessons + 1) / totalLessons) * 100),
    100
  );
console.log("completed",completed_at)
  // Create the lesson progress
  const progress = await prisma.lesson_progress.create({
    data: {
      user_id: userId,
      lesson_id: lessonId,
      status: status,
      completed_at: completed_at

    },
    include: {
      lessons: {
        select: {
          modules: true
        }
      }
    }
  });

  // Prepare enrollment update data
  const updateData = {
    last_accessed_lesson_id: lessonId,
    last_accessed_module_id: progress.lessons.modules.id,
    progress_percent: newProgressPercent,
    ...(newProgressPercent === 100 ? { 
      completed_at: new Date().toISOString() 
    } : {})
  };

  // Update the enrollment
  await prisma.enrollments.update({
    where: {
      user_id_course_id: { user_id: userId, course_id: course.id },
    },
    data: updateData
  });

  await deleteFromCache(cacheKey);
  const keys = await redis.keys(cacheKeyE);
if (keys.length > 0) {
  // Spread the array so each key is its own argument
  await redis.del(...keys);
}
ClearDashboardCache(userId);

  // Return the created progress record
  const createdProgress = await prisma.lesson_progress.findUnique({
    where: {
      user_id_lesson_id: {
        user_id: userId,
        lesson_id: lessonId
      }
    }
  });

  if (!createdProgress) throw new Error('Failed to create lesson progress');
  return createdProgress;
};