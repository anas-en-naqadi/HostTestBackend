// src/services/category/update.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { AppError } from '../../middleware/error.middleware';
import { UpdateCategoryDto, CategoryResponse } from '../../types/category.types';
import { deleteFromCache,clearCacheByPrefix } from '../../utils/cache.utils';
import { CACHE_KEYS, generateCacheKey } from '../../utils/cache.utils';
const prisma = new PrismaClient();

/**
 * Update a category’s name (and slug)
 */
export const updateCategory = async (
  slug: string,
  dto: UpdateCategoryDto
): Promise<CategoryResponse> => {
  const data: Record<string, any> = {};
  if (dto.name) {
    data.name = dto.name;
    data.slug = slugify(dto.name, { lower: true, strict: true });
  }

  try {
     const category = await prisma.categories.update({
      where: { slug:slug },
      data,
      select: { id: true, name: true, slug: true },
    });
     // Invalidate caches
  try {
    // Delete the specific user cache
    await deleteFromCache(generateCacheKey(CACHE_KEYS.USER, slug));
    
    // Clear the users list cache
    await clearCacheByPrefix(CACHE_KEYS.CATEGORY);
    
    console.log(`Cache invalidated for user ${slug} and users list`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    // Continue execution even if cache invalidation fails
  }
  return category;

  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new AppError(404, 'Category not found');
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new AppError(409, 'Category with this name already exists');
    }
    throw new AppError(500, 'Could not update category');
  }
};
