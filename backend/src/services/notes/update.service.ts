import { PrismaClient, notes } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { generateCacheKey,deleteFromCache, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

export const updateNote = async (
  userId: number,
  id: number,
  content: string
): Promise<notes> => {
  const note = await prisma.notes.findUnique({ where: { id },select:{user_id:true,lessons:{select:{title:true,order_position:true,content_type:true,modules:{select:{title:true,order_position:true,courses:{select:{slug:true}}}}}}} });
  if (!note || note.user_id !== userId) {
    throw new AppError(404,'Note not found');
  }

  const updatedNote = await prisma.notes.update({
    where: { id },
    data: { content, updated_at: new Date() },
  });
  const noteData = {
    ...updatedNote,
    lesson_title: note.lessons.title,
    lesson_order_position: note.lessons.order_position,
    module_title: note.lessons.modules.title,
    module_order_position: note.lessons.modules.order_position,
    lesson_type: note.lessons.content_type
  }

 const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${note.lessons.modules.courses.slug}-${userId}`);
  await deleteFromCache(cacheKey);
  return noteData;
};