import { PrismaClient } from "@prisma/client";
import {
  deleteFromCache,
  generateCacheKey,
  CACHE_KEYS,
} from "../../utils/cache.utils";
import { AppError } from "../../middleware/error.middleware";
import { ClearDashboardCache } from "../../utils/clear_cache.utils";
import redis from "../../config/redis";

const prisma = new PrismaClient();
const getWishlistsCachePattern = (userId: number) => `wishlists:${userId}:*`;

export const deleteWishlist = async (
  userId: number,
  courseId: number,
  mainCourseId?: number | null
): Promise<void> => {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new AppError(404, "Course not Found");
  }

  const wishlist = await prisma.wishlists.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (!wishlist) {
    throw new Error("Wishlist entry not found");
  }

  await prisma.wishlists.delete({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
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
  const pattern = `wishlists:${userId}:*`;
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `detail-${course.slug}`);
  await deleteFromCache(cacheKey);
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
  }

  ClearDashboardCache(userId);
};
