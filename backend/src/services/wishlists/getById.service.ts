import { PrismaClient, wishlists } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistByIdCacheKey = (userId: number, courseId: number) => `wishlist:${userId}:${courseId}`;

export const getWishlistById = async (userId: number, courseId: number): Promise<wishlists> => {
  const cacheKey = getWishlistByIdCacheKey(userId, courseId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const wishlist = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    include: { courses: true }, // Optional: include course details
  });
  if (!wishlist) {
    throw new Error('Wishlist entry not found');
  }

  await redis.set(cacheKey, JSON.stringify(wishlist), 'EX', 3600);
  return wishlist;
};