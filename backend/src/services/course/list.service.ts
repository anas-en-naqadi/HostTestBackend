import prisma from "../../config/prisma";
import { CourseResponse } from "../../types/course.types";
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export const listAllCourses = async (): Promise<CourseResponse[]> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSES, "list");

  // Check cache
  const cached = await getFromCache<CourseResponse[]>(cacheKey);
  if (cached) return cached;

  try {
    const courses = await prisma.courses.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail_url: true,
        difficulty:true,
        total_duration:true,
        is_published: true,
        subtitle:true,
        created_at: true,
        instructors: {
          select: {
            id: true,
            specialization: true,
            users:{
                select:{
                    full_name:true,
                }
            }
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Store result in cache
    await setInCache(cacheKey, courses);

    return courses as CourseResponse[];
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new Error("Failed to load courses.");
  }
};
