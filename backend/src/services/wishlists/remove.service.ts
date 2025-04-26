import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistsCacheKey = (userId: number) => `wishlists:${userId}`;
const getWishlistByIdCacheKey = (userId: number, courseId: number) => `wishlist:${userId}:${courseId}`;

export const deleteWishlist = async (userId: number, courseId: number): Promise<void> => {
  const wishlist = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (!wishlist) {
    throw new Error('Wishlist entry not found');
  }

  await prisma.wishlists.delete({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });

  await redis.del(getWishlistsCacheKey(userId));
  await redis.del(getWishlistByIdCacheKey(userId, courseId));
};