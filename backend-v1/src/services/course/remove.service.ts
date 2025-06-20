import prisma from "../../config/prisma";
import { Prisma } from '@prisma/client';
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, deleteFromCache, generateCacheKey, deletePatternFromCache } from "../../utils/cache.utils";

// Remove a course by its ID  
export const removeCourseBySlug = async (slug: string, userId: number): Promise<void> => {
  // Check if the course exists first
  const course = await prisma.courses.findUnique({
    where: { slug },
  });

  // If the course does not exist, throw an error with 404 status
  if (!course) {
    throw new AppError(404, "Course not found");
  }

  try {
    // Delete the course and its related entities (due to cascading delete)
    await prisma.courses.delete({
      where: { slug },
    });

    // Invalidate all related caches
    try {
      // Delete specific course caches
      await deletePatternFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${slug}-*`));
      await deletePatternFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${slug}-*`));
      
      // Clear user-specific course list caches
      await deletePatternFromCache(`${CACHE_KEYS.COURSES}:user-*`);
      
      // Clear general course list caches
      await clearCacheByPrefix(CACHE_KEYS.COURSES);
      
      console.log(`Cache invalidated for course ${slug} and all related caches`);
    } catch (cacheError) {
      // Just log cache errors but don't fail the operation
      console.error('Error invalidating cache:', cacheError);
    }
  } catch (err) {
    // Handle Prisma-specific errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError(404, 'Course not found');
      }
      // For other Prisma errors, throw a generic error
      throw new AppError(500, 'Database error occurred');
    }
    
    throw new AppError(500, 'Could not delete course');
  }
};