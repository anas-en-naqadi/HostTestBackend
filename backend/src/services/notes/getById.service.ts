import { PrismaClient, notes } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getNoteByIdCacheKey = (id: number) => `note:${id}`;

export const getNoteById = async (userId: number, id: number): Promise<notes> => {
  const cacheKey = getNoteByIdCacheKey(id);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const note = await prisma.notes.findUnique({ where: { id } });
  if (!note || note.user_id !== userId) {
    throw new Error('Note not found or unauthorized');
  }

  await redis.set(cacheKey, JSON.stringify(note), 'EX', 3600);
  return note;
};