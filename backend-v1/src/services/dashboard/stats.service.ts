
// services/dashboard.ts
import prisma from '../../config/prisma';
import { generateCacheKey, getFromCache, setInCache } from "../../utils/cache.utils";

export async function getUserDashboardStats(userId: number) {
  const cacheKey = generateCacheKey("user-dashboard-stats", String(userId));
  const cached = await getFromCache(cacheKey);
  if (cached) return cached as any;

  // Get total studied courses (all enrollments)
  const totalCourses = await prisma.enrollments.count({
    where: { user_id: userId }
  });

  // Get completed courses
  const completedCourses = await prisma.enrollments.count({
    where: { 
      user_id: userId,
      completed_at: { not: null }
    }
  });

  // Get ongoing courses (enrolled but not completed)
  const ongoingCourses = await prisma.enrollments.count({
    where: { 
      user_id: userId,
      completed_at: null 
    }
  });

  // Calculate total hours spent (sum of lessons duration where progress is completed)
  const completedLessons = await prisma.lesson_progress.findMany({
    where: {
      user_id: userId,
      status: "completed"
    },
    include: {
      lessons: {
        select: {
          duration: true
        }
      }
    }
  });

  // Calculate hours spent (convert from minutes to hours)
  const totalSeconds = completedLessons.reduce((acc, lesson) => {
    return acc + (lesson.lessons.duration || 0);
  }, 0);
  const hoursSpent = Math.round(totalSeconds / 3600);
 
  // Get platform maximum values for comparison
  // These could be made more dynamic based on top performers or set goals
  const result = {
    totalCourses: {
      value: totalCourses,
      maxValue: Math.max(totalCourses, 10) // At least 10 or current value
    },
    completedCourses: {
      value: completedCourses,
      maxValue: totalCourses // Can't complete more than enrolled in
    },
    ongoingCourses: {
      value: ongoingCourses,
      maxValue: Math.max(ongoingCourses, 5) // At least 5 or current value
    },
    hoursSpent: {
      value: hoursSpent,
      maxValue: Math.max(hoursSpent, 100) // At least 100 or current value
    }
  };

  await setInCache(cacheKey, result, 15 * 60); // Cache for 15 minutes
  return result;
}
