import { PrismaClient, notes } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getNotesCacheKey = (userId: number) => `notes:${userId}`;
const getNoteByIdCacheKey = (id: number) => `note:${id}`; // Add this

export const updateNote = async (
  userId: number,
  id: number,
  content: string
): Promise<notes> => {
  const note = await prisma.notes.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or unauthorized');
  }

  const updatedNote = await prisma.notes.update({
    where: { id },
    data: { content, updated_at: new Date() },
  });

  // Invalidate both caches
  await redis.del(getNotesCacheKey(userId));
  await redis.del(getNoteByIdCacheKey(id)); // Add this

  return updatedNote;
};