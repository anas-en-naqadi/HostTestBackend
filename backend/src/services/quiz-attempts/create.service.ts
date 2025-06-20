import { PrismaClient, quiz_attempts } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from '../../utils/cache.utils';
import { ClearDashboardCache } from '../../utils/clear_cache.utils';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

export const createQuizAttempt = async (
  userId: number,
  quizId: number,
  completed_at: number,
  started_at: Date,
  score: number,
  passed: boolean,
  slug: string,
): Promise<quiz_attempts> => {
  // Calculate the completed_at date properly
  const completedAtDate = new Date(new Date(started_at).getTime() + completed_at * 1000);
  
  // Use a transaction for data consistency
  const attempt = await prisma.$transaction(async (tx) => {
    // Simply check if the quiz exists
    const quiz = await tx.quizzes.findUnique({
      where: { id: quizId }
    });

    // Check if quiz exists
    if (!quiz) {
      throw new AppError(404, 'Quiz not found');
    }


    // Check for duplicate attempt (same user, quiz, and timestamps)
    const existing = await tx.quiz_attempts.findFirst({
      where: {
        user_id: userId,
        quiz_id: quizId,
        started_at,
        completed_at: completedAtDate,
      },
    });

    if (existing) {
      throw new AppError(409, 'This quiz attempt has already been recorded');
    }

    // Create the quiz attempt
    return tx.quiz_attempts.create({
      data: {
        user_id: userId,
        quiz_id: quizId,
        started_at,
        completed_at: completedAtDate,
        score,
        passed,
      },
    });
  }, {
    isolationLevel: 'Serializable',
  });

  // Clear relevant caches
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${slug}-${userId}`);
  await deleteFromCache(cacheKey);
  await ClearDashboardCache(userId);
  
  return attempt;
};