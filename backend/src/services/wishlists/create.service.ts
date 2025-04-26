import { PrismaClient, wishlists } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistsCacheKey = (userId: number) => `wishlists:${userId}`;

export const createWishlist = async (userId: number, courseId: number): Promise<wishlists> => {
  const course = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new Error('Course not found');
  }

  const existing = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (existing) {
    throw new Error('Course already in wishlist');
  }

  const wishlist = await prisma.wishlists.create({
    data: {
      user_id: userId,
      course_id: courseId,
    },
  });

  await redis.del(getWishlistsCacheKey(userId));
  return wishlist;
};