import { PrismaClient, quiz_attempts } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from '../../utils/cache.utils';
import { ClearDashboardCache } from '../../utils/clear_cache.utils';


const prisma = new PrismaClient();

export const createQuizAttempt = async (
  userId: number,
  quizId: number,
  completed_at:number,
  started_at:Date,
  score:number,
  passed:boolean,
  slug:string,
): Promise<quiz_attempts> => {
  const quiz = await prisma.quizzes.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const lesson = await prisma.lessons.findFirst({
    where: { quiz_id: quizId },
    include: {
      modules: {
        include: {
          courses: { include: { enrollments: true } },
        },
      },
    },
  });
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${slug}`);

  const isEnrolled = lesson?.modules.courses.enrollments.some((e) => e.user_id === userId);
  if (!lesson || !isEnrolled) {
    throw new Error('Unauthorized: User not enrolled in the course');
  }

  const completedAtDate = new Date(new Date(started_at).getTime() + completed_at * 1000);
    const attempt = await prisma.quiz_attempts.create({
    data: {
      user_id: userId,
      quiz_id: quizId,
      started_at,
      score,
      completed_at:completedAtDate,
      passed
    },
  });
 await deleteFromCache(cacheKey);
ClearDashboardCache(userId);
  return attempt;
};