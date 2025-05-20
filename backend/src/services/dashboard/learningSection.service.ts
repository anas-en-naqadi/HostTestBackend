import {
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";
import prisma from "../../config/prisma";
export async function getNextLearningCourses(userId: number) {
  const cacheKey = generateCacheKey("next-to-learn", String(userId));
  const cached = await getFromCache(cacheKey);
  if (cached) return cached as any[];

  // Exclude courses the user already enrolled in
  const enrolled = await prisma.enrollments.findMany({
    where: { user_id: userId },
    select: { course_id: true },
  });
  const excludedIds = enrolled.map((e) => e.course_id);

  // Fetch 5 most popular PUBLISHED courses (not unpublished)
  const courses = await prisma.courses.findMany({
    where: {
      is_published: true,
      id: { notIn: excludedIds },
    },
    take: 5,
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      total_duration: true,
      difficulty: true,
      slug: true,
      user: {
        select: {
          full_name: true,
        },
      },
      wishlists: {
        where: { user_id: userId },
        select: { user_id: true },
      },
      categories: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ enrollments: { _count: "desc" } }, { created_at: "desc" }],
  });

  await setInCache(cacheKey, courses, 15 * 60); // 15m
  return courses;
}
