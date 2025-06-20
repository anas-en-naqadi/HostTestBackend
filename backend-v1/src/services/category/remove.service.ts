// src/services/category/remove.service.ts
import { Prisma } from "@prisma/client";
import { AppError } from "../../middleware/error.middleware";
import prisma from "../../config/prisma";
import { CACHE_KEYS, deleteFromCache, deletePatternFromCache, generateCacheKey } from "../../utils/cache.utils";

/**
 * Delete a category
 */
export const removeCategory = async (slug: string, userId: number): Promise<void> => {
  try {
    await prisma.categories.delete({
      where: { slug: slug },
    });

    // First fetch all courses in this category using slug
    const courses = await prisma.courses.findMany({
      where: { 
        categories: {
          slug: slug // Using the incoming slug parameter
        }
      },
      select: { slug: true }
    });

    // Delete cache for each related course
    await Promise.all(
      courses.map(course => 
        deletePatternFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${course.slug}-*`))
      )
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new AppError(404, "Category not found");
    }
    throw new AppError(500, "Could not delete category");
  }
};
