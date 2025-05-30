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
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      enrollments: { 
        select: { 
          course_id: true,
          courses: { 
            select: { 
              category_id: true 
            } 
          } 
        } 
      },
      wishlists: { 
        select: { 
          course_id: true,
          courses: { 
            select: { 
              category_id: true 
            } 
          } 
        } 
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User Not Found");
  }

  // Extract category IDs from enrolled and wishlisted courses
  const categoryIds = [
    ...new Set(
      [
        ...(user.enrollments.map(e => e.courses?.category_id) || []),
        ...(user.wishlists.map(w => w.courses?.category_id) || []),
      ].filter((n): n is number => typeof n === "number")
    ),
  ];

  // If the user has no category history, return empty
  if (categoryIds.length === 0) {
    await setInCache(cacheKey, [], 30 * 60);
    return [];
  }

  // Get IDs of courses the user is already enrolled in
  const enrolledCourseIds = user.enrollments.map(e => e.course_id);

  const suggestions = await prisma.courses.findMany({
    where: {
      is_published: true,
      category_id: { in: categoryIds },
      id: { notIn: enrolledCourseIds },
    },
    take: 8,
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
      categories: { select: { name: true } },
      _count: { select: { enrollments: true } },
      wishlists: {
        where: { user_id: userId },
        select: { user_id: true },
      },
    },
    orderBy: [{ enrollments: { _count: "desc" } }, { created_at: "desc" }],
  });

  await setInCache(cacheKey, suggestions, 30 * 60);
  return suggestions;
}
