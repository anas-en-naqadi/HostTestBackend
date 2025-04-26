import { PrismaClient, wishlists } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistsCacheKey = (userId: number) => `wishlists:${userId}`;
const getWishlistByIdCacheKey = (userId: number, courseId: number) => `wishlist:${userId}:${courseId}`;

export const updateWishlist = async (userId: number, courseId: number): Promise<wishlists> => {
  const wishlist = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (!wishlist) {
    throw new Error('Wishlist entry not found');
  }

  const updatedWishlist = await prisma.wishlists.update({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    data: { created_at: new Date() }, // Limited fields to update
  });

  await redis.del(getWishlistsCacheKey(userId));
  await redis.del(getWishlistByIdCacheKey(userId, courseId));
  return updatedWishlist;
};