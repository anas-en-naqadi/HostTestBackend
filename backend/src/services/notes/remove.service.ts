import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getNotesCacheKey = (userId: number) => `notes:${userId}`;
const getNoteByIdCacheKey = (id: number) => `note:${id}`; // Add this

export const deleteNote = async (userId: number, id: number): Promise<void> => {
  const note = await prisma.notes.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or unauthorized');
  }

  await prisma.notes.delete({ where: { id } });
  // Invalidate both caches
  await redis.del(getNotesCacheKey(userId));
  await redis.del(getNoteByIdCacheKey(id)); // Add this
};