import { PrismaClient, wishlists } from "@prisma/client";
import {
  deleteFromCache,
  generateCacheKey,
  CACHE_KEYS,
} from "../../utils/cache.utils";
import { ClearDashboardCache } from "../../utils/clear_cache.utils";
import redis from "../../config/redis";
const prisma = new PrismaClient();
const getWishlistsCachePattern = (userId: number) => `wishlists:${userId}:*`;

export const createWishlist = async (
  userId: number,
  courseId: number,
  mainCourseId?: number | null
): Promise<wishlists> => {
  const course = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new Error("Course not found");
  }

  const existing = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (existing) {
    throw new Error("Course already in wishlist");
  }

  const wishlist = await prisma.wishlists.create({
    data: {
      user_id: userId,
      course_id: courseId,
    },
  });
  if (mainCourseId) {
    const main_course = await prisma.courses.findUnique({
      where: { id: mainCourseId },
      select: { slug: true },
    });
    if (!main_course) throw new Error("Course not found");

    await deleteFromCache(
      generateCacheKey(CACHE_KEYS.COURSE, `detail-${main_course.slug}`)
    );
  }

  ClearDashboardCache(userId);
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `detail-${course.slug}`);
  await deleteFromCache(cacheKey);
  const keys = await redis.keys(getWishlistsCachePattern(userId));
  if (keys.length > 0) {
    // Spread the array so each key is its own argument
    await redis.del(...keys);
  }
  return wishlist;
};
