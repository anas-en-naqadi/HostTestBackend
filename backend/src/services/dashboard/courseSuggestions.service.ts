import { AppError } from "../../middleware/error.middleware";
import prisma from "../../config/prisma";
import {
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export async function getFieldFocusedSuggestions(userId: number) {
  const cacheKey = generateCacheKey("course-suggestions", String(userId));
  const cached = await getFromCache(cacheKey);
  if (cached) return cached as any[];

  // Gather the user's category interests
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      enrollments: { select: { courses: { select: { category_id: true } } } },
      wishlists: { select: { courses: { select: { category_id: true } } } },
    },
  });

  if (!u) {
    throw new AppError(404, "User Not Found");
  }
  const categoryIds = [
    ...new Set(
      [
        ...(u?.enrollments.flatMap((e) => e.courses.category_id) || []),
        ...(u?.wishlists.flatMap((w) => w.courses.category_id) || []),
      ].filter((n): n is number => typeof n === "number")
    ),
  ];

  // If the user has no category history, return empty
  if (categoryIds.length === 0) {
    await setInCache(cacheKey, [], 30 * 60);
    return [];
  }

  // Exclude already enrolled courses
  const enrolled = await prisma.enrollments.findMany({
    where: { user_id: userId },
    select: { course_id: true },
  });

  const exclude = enrolled.map((e) => e.course_id);

  const suggestions = await prisma.courses.findMany({
    where: {
      is_published: true,
      category_id: { in: categoryIds },
      id: { notIn: exclude },
    },
    take: 8,
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      total_duration: true,
      difficulty: true,
      slug: true,
      instructors: {
        select: {
          users: {
            select: {
              full_name: true,
            },
          },
        },
      },
      categories: { select: { name: true } },
      _count: { select: { enrollments: true } },
      wishlists: {
        where: { user_id: userId },
        select: { user_id: true },
      },
    },
    orderBy: [{ wishlists: { _count: "desc" } }, { created_at: "desc" }],
  });

  await setInCache(cacheKey, suggestions, 30 * 60);
  return suggestions;
}
