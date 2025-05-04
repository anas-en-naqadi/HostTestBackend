// src/services/dashboardService.ts
import { getISOWeekDates } from '../../utils/date.utils';
import prisma from '../../config/prisma';
import { generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';

export  async function getTimeSpendingData(userId: number) {
    try {
      // Get current week's start and end dates
      const { startDate, endDate } = getISOWeekDates();
      
      // Get activity logs for the week
      const activityLogs = await prisma.activity_logs.findMany({
        where: {
          user_id: userId,
          activity_type: 'course_viewed',
          created_at: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          created_at: 'asc'
        }
      });
      
      // Group logs by day of week and calculate hours
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dailyHours = new Array(7).fill(0);
      
      // Process activity logs to calculate hours per day
      activityLogs.forEach(log => {
        if (!log.created_at) return;
        
        const day = log.created_at.getDay(); // 0 = Sunday, 6 = Saturday
        const dayIndex = day === 0 ? 6 : day - 1; // Convert to Mon-Sun format (0 = Monday)
        
        // Assume each activity log represents 15 minutes of activity
        dailyHours[dayIndex] += 0.25;
      });
      
      // Format data for chart
      return {
        labels: dayNames,
        values: dailyHours
      };
    } catch (error) {
      console.error('Error in getTimeSpendingData:', error);
      throw new Error('Failed to get time spending data');
    }
  }

  /**
   * Get quiz grade distribution data
   * @param userId The user ID
   * @returns Grade distribution data
   */
export  async function getGradeDistribution(userId: number) {
    try {
      // Get all quiz attempts for the user
      const quizAttempts = await prisma.quiz_attempts.findMany({
        where: {
          user_id: userId,
          completed_at: { not: null }
        },
        include: {
          quizzes: {
            include: {
              questions: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });
      
      // Calculate score percentage and group into ranges
      const scoreRanges = {
        '90-100%': 0,
        '80-89%': 0,
        '70-79%': 0,
        '60-69%': 0,
        '<60%': 0
      };
      
      quizAttempts.forEach(attempt => {
        if (attempt.score === null) return;
        
        // Calculate total possible score (number of questions)
        const totalQuestions = attempt.quizzes.questions.length;
        if (totalQuestions === 0) return;
        
        // Calculate percentage
        const percentage = (attempt.score / totalQuestions) * 100;
        
        // Increment appropriate range
        if (percentage >= 90) {
          scoreRanges['90-100%']++;
        } else if (percentage >= 80) {
          scoreRanges['80-89%']++;
        } else if (percentage >= 70) {
          scoreRanges['70-79%']++;
        } else if (percentage >= 60) {
          scoreRanges['60-69%']++;
        } else {
          scoreRanges['<60%']++;
        }
      });
      
      // Format data for chart
      return {
        labels: Object.keys(scoreRanges),
        values: Object.values(scoreRanges)
      };
    } catch (error) {
      console.error('Error in getGradeDistribution:', error);
      throw new Error('Failed to get grade distribution data');
    }
  }

export async function getDashboardChartData(userId: number) {

  const cacheKey = generateCacheKey("dashboard-states", userId);

  // Attempt to read from Redis cache
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // On cache miss, fetch fresh data
  const [timeSpendingData, gradeDistributionData] = await Promise.all([
    getTimeSpendingData(userId),
    getGradeDistribution(userId),
  ]);

  const payload = { timeSpendingData, gradeDistributionData };

  // Store combined payload in cache (default TTL)
  await setInCache(cacheKey, payload);

  return payload;
}
