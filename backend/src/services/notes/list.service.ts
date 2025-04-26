import { PrismaClient, notes } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getNotesCacheKey = (userId: number) => `notes:${userId}`;

export const getNotes = async (userId: number): Promise<notes[]> => {
  const cacheKey = getNotesCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const notes = await prisma.notes.findMany({
    where: { user_id: userId },
  });

  await redis.set(cacheKey, JSON.stringify(notes), 'EX', 3600); // Cache for 1 hour
  return notes;
};