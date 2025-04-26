import { PrismaClient, lesson_progress } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getProgressCacheKey = (userId: number) => `lesson_progress:${userId}`;

export const getLessonProgress = async (userId: number): Promise<lesson_progress[]> => {
  const cacheKey = getProgressCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const progress = await prisma.lesson_progress.findMany({
    where: { user_id: userId },
    include: { lessons: true },
  });

  await redis.set(cacheKey, JSON.stringify(progress), 'EX', 3600); // Cache for 1 hour
  return progress;
};