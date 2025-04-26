import { PrismaClient, notes } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getNotesCacheKey = (userId: number) => `notes:${userId}`;

export const createNote = async (
  userId: number,
  data: { lessonId: number; content: string }
): Promise<notes> => {
  const lesson = await prisma.lessons.findUnique({
    where: { id: data.lessonId },
    include: { modules: { include: { courses: { include: { enrollments: true } } } } },
  });
  if (!lesson || !lesson.modules.courses.enrollments.some(e => e.user_id === userId)) {
    throw new Error('Lesson not found or user not enrolled in the course');
  }

  const note = await prisma.notes.create({
    data: {
      user_id: userId,
      lesson_id: data.lessonId,
      content: data.content,
    },
  });

  await redis.del(getNotesCacheKey(userId));
  return note;
};