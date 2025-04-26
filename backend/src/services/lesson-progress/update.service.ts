import { PrismaClient, lesson_progress } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getProgressCacheKey = (userId: number) => `lesson_progress:${userId}`;
const getProgressByIdCacheKey = (userId: number, lessonId: number) => `lesson_progress:${userId}:${lessonId}`;

export const updateLessonProgress = async (
  userId: number,
  lessonId: number,
  data: { status?: string; completedAt?: Date | null }
): Promise<lesson_progress> => {
  const progress = await prisma.lesson_progress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });
  if (!progress) throw new Error('Lesson progress not found');
  if (progress.user_id !== userId) throw new Error('Unauthorized');

  const updatedProgress = await prisma.lesson_progress.update({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
    data: {
      status: data.status,
      completed_at: data.completedAt === null ? null : data.completedAt ? new Date(data.completedAt) : undefined,
      updated_at: new Date(),
    },
  });

  await redis.del(getProgressCacheKey(userId));
  await redis.del(getProgressByIdCacheKey(userId, lessonId));
  return updatedProgress;
};