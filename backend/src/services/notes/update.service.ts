import { PrismaClient, notes } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { generateCacheKey,deleteFromCache, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

export const updateNote = async (
  userId: number,
  id: number,
  content: string
): Promise<notes> => {
  const note = await prisma.notes.findUnique({ where: { id },select:{user_id:true,lessons:{select:{modules:{select:{courses:{select:{slug:true}}}}}}} });
  if (!note || note.user_id !== userId) {
    throw new AppError(404,'Note not found');
  }

  const updatedNote = await prisma.notes.update({
    where: { id },
    data: { content, updated_at: new Date() },
  });

 const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${note.lessons.modules.courses.slug}`);
  await deleteFromCache(cacheKey);
  return updatedNote;
};