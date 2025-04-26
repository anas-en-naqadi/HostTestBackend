import { PrismaClient, lesson_progress } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getProgressCacheKey = (userId: number) => `lesson_progress:${userId}`;

export const createLessonProgress = async (
  userId: number,
  lessonId: number,
  status?: string
): Promise<lesson_progress> => {
  const lessonExists = await prisma.lessons.findUnique({ where: { id: lessonId } });
  if (!lessonExists) throw new Error('Lesson not found');

  const existingProgress = await prisma.lesson_progress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });
  if (existingProgress) throw new Error('Progress already tracked for this lesson');

  const progress = await prisma.lesson_progress.create({
    data: {
      user_id: userId,
      lesson_id: lessonId,
      status: status || 'not_started',
    },
  });

  await redis.del(getProgressCacheKey(userId));
  return progress;
};