import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getProgressCacheKey = (userId: number) => `lesson_progress:${userId}`;
const getProgressByIdCacheKey = (userId: number, lessonId: number) => `lesson_progress:${userId}:${lessonId}`;

export const deleteLessonProgress = async (userId: number, lessonId: number): Promise<void> => {
  const progress = await prisma.lesson_progress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });
  if (!progress) throw new Error('Lesson progress not found');
  if (progress.user_id !== userId) throw new Error('Unauthorized');

  await prisma.lesson_progress.delete({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });

  await redis.del(getProgressCacheKey(userId));
  await redis.del(getProgressByIdCacheKey(userId, lessonId));
};