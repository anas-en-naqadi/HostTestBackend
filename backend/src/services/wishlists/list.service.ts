import { PrismaClient, wishlists } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistsCacheKey = (userId: number) => `wishlists:${userId}`;

export const getWishlists = async (userId: number): Promise<wishlists[]> => {
  const cacheKey = getWishlistsCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const wishlists = await prisma.wishlists.findMany({
    where: { user_id: userId },
    include: { courses: true }, // Optional: include course details
  });

  await redis.set(cacheKey, JSON.stringify(wishlists), 'EX', 3600);
  return wishlists;
};