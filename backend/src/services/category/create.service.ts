// src/services/category/create.service.ts

import { PrismaClient, Prisma } from '@prisma/client';
import slugify from 'slugify';
import { AppError } from '../../middleware/error.middleware';
import { CreateCategoryDto, CategoryResponse } from '../../types/category.types';
import { CACHE_KEYS } from '../../utils/cache.utils';
import { clearCacheByPrefix } from '../../utils/cache.utils';
const prisma = new PrismaClient();

/**
 * Create a new category (slug auto‑generated)
 */
export const createCategory = async (
  dto: CreateCategoryDto
): Promise<CategoryResponse> => {
  const slug = slugify(dto.name, { lower: true, strict: true });

  try {
    const category = await prisma.categories.create({
      data: { name: dto.name, slug },
      select: { id: true, name: true, slug: true },
    });
     // Invalidate users list cache
  try {
    await clearCacheByPrefix(CACHE_KEYS.CATEGORIES);
    console.log('Cache invalidated for users list after creation');
  } catch (error) {
    console.error('Error invalidating cache:', error);
    // Continue execution even if cache invalidation fails
  }
  return  category;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new AppError(409, 'Category with this name already exists');
    }
    throw new AppError(500, 'Could not create category');
  }
};
