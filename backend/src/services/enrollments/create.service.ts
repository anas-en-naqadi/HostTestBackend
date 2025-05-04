import { PrismaClient, enrollments } from "@prisma/client";
import redis from "../../config/redis";
import { AppError } from "../../middleware/error.middleware";
import {
  deleteFromCache,
  CACHE_KEYS,
  generateCacheKey,
} from "../../utils/cache.utils";
import { ClearDashboardCache } from "../../utils/clear_cache.utils";
const prisma = new PrismaClient();
const getEnrollmentsCachePattern = (userId: number) =>
  `enrollments:${userId}:*`;

export const createEnrollment = async (
  userId: number,
  courseId: number
): Promise<enrollments> => {
  const courseExists = await prisma.courses.findUnique({
    where: { id: courseId },
    select: {
      slug: true,
      modules: {
        select: {
          id: true,
          lessons: { select: { id: true } },
        },
      },
    },
  });
  if (!courseExists) throw new AppError(404, "Course not found");

  const existingEnrollment = await prisma.enrollments.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (existingEnrollment)
    throw new AppError(400, "User already enrolled in this course");

  const enrollment = await prisma.enrollments.create({
    data: {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date(),
      last_accessed_module_id: courseExists.modules[0].id,
      last_accessed_lesson_id: courseExists.modules[0].lessons[0].id,
    },
  });
  await deleteFromCache(
    generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseExists.slug}`)
  );

  const keys = await redis.keys(getEnrollmentsCachePattern(userId));
  if (keys.length > 0) await redis.del(keys);
  ClearDashboardCache(userId);
  return enrollment;
};
