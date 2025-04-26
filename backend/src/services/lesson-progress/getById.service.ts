import { PrismaClient, lesson_progress } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getProgressByIdCacheKey = (userId: number, lessonId: number) => `lesson_progress:${userId}:${lessonId}`;

export const getLessonProgressById = async (
  userId: number,
  lessonId: number
): Promise<lesson_progress> => {
  const cacheKey = getProgressByIdCacheKey(userId, lessonId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const progress = await prisma.lesson_progress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
    include: { lessons: true },
  });

  if (!progress) throw new Error('Lesson progress not found');
  if (progress.user_id !== userId) throw new Error('Unauthorized');

  await redis.set(cacheKey, JSON.stringify(progress), 'EX', 3600);
  return progress;
};