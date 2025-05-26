import { PrismaClient, notes } from '@prisma/client';
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from '../../utils/cache.utils';

const prisma = new PrismaClient();

export const createNote = async (
  userId: number,
  data: { lessonId: number; content: string,noted_at:number }
): Promise<notes> => {
  const lesson = await prisma.lessons.findUnique({
    where: { id: data.lessonId },
    include: { modules: { include: { courses: {select:{slug:true,enrollments:true}} } } },
  });
  if (!lesson || !lesson.modules.courses.enrollments.some(e => e.user_id === userId)) {
    throw new Error('Lesson not found or user not enrolled in the course');
  }

  const note = await prisma.notes.create({
    data: {
      user_id: userId,
      lesson_id: data.lessonId,
      content: data.content,
      noted_at:data.noted_at
    },
  });
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${lesson.modules.courses.slug}`);
await deleteFromCache(cacheKey);
  return note;
};