import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { generateCacheKey,deleteFromCache, CACHE_KEYS } from '../../utils/cache.utils';
const prisma = new PrismaClient();

export const deleteNote = async (userId: number, id: number): Promise<void> => {
  const note = await prisma.notes.findUnique({ where: { id },select:{user_id:true,lessons:{select:{modules:{select:{courses:{select:{slug:true}}}}}}} });
  if (!note || note.user_id !== userId) {
    throw new AppError(404,'Note not found or unauthorized');
  }
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${note.lessons.modules.courses.slug}-${userId}`);
  await deleteFromCache(cacheKey);
  await prisma.notes.delete({ where: { id } });
};