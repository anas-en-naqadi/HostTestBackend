import { PrismaClient, user_answers } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getUserAnswersCacheKey = (userId: number) => `user_answers:${userId}`;

export const getUserAnswers = async (userId: number): Promise<user_answers[]> => {
  const cacheKey = getUserAnswersCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const answers = await prisma.user_answers.findMany({
    where: {
      quiz_attempts: { user_id: userId },
    },
  });

  await redis.set(cacheKey, JSON.stringify(answers), 'EX', 3600);
  return answers;
};