// src/services/category/remove.service.ts
import {  Prisma } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { deleteFromCache,clearCacheByPrefix } from '../../utils/cache.utils';
import { CACHE_KEYS, generateCacheKey } from '../../utils/cache.utils';
import prisma from '../../config/prisma';

/**
 * Delete a category
 */
export const removeCategory = async (
  slug: string
): Promise<void> => {
  try {
     await prisma.categories.delete({
      where: { slug:slug }
    });
     // Invalidate caches
  try {
    // Delete the specific user cache
    await deleteFromCache(generateCacheKey(CACHE_KEYS.CATEGORY, slug));
    
    // Clear the users list cache
    await clearCacheByPrefix(CACHE_KEYS.CATEGORIES);
    
    console.log(`Cache invalidated for user ${slug} and users list`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    // Continue execution even if cache invalidation fails
  }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new AppError(404, 'Category not found');
    }
    throw new AppError(500, 'Could not delete category');
  }
};
