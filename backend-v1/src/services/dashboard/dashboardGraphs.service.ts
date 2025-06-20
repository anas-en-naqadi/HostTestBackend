// src/services/dashboardService.ts
import { getISOWeekDates } from '../../utils/date.utils';
import prisma from '../../config/prisma';
import { generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';

export async function getTimeSpendingData(userId: number) {
  // 1) Compute this week’s Monday 00:00 and Sunday 23:59
  const { startDate, endDate } = getISOWeekDates();

  // 2) Fetch completed lessons for the user within this week
  const progresses = await prisma.lesson_progress.findMany({
    where: {
      user_id: userId,
      status: 'completed',
      completed_at: { gte: startDate, lte: endDate }
    },
    include: {
      lessons: { select: { duration: true } } // duration in seconds
    },
    orderBy: { completed_at: 'asc' }
  });

  // 3) Prepare 7-day buckets (Mon=0 … Sun=6)
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dailySeconds = new Array<number>(7).fill(0);

  const getDayIndex = (d: Date) => {
    const dow = d.getDay(); // 0 = Sun … 6 = Sat
    return dow === 0 ? 6 : dow - 1; // shift so Mon=0 … Sun=6
  };

  // 4) Accumulate each lesson’s duration into its completion day
  for (const p of progresses) {
    if (!p.completed_at || p.lessons.duration == null) continue;
    const idx = getDayIndex(p.completed_at);
    dailySeconds[idx] += p.lessons.duration;
  }

  // 5) Return durations in **whole minutes** (no decimals)
const dailyMinutes = dailySeconds.map(sec => Math.floor(sec / 60));


  return { labels: dayNames, values: dailyMinutes };
}



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

  const cacheKey = generateCacheKey("dashboard-states", String(userId));

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
