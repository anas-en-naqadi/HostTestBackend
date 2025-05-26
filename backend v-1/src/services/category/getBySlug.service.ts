// src/services/category/getById.service.ts

import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { CategoryResponse } from '../../types/category.types';
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Get a category by ID, with cache
 */
export const getCategoryBySlug = async (
  slug: string
): Promise<CategoryResponse> => {
  const key = generateCacheKey(CACHE_KEYS.CATEGORY, slug);
  const cached = await getFromCache<CategoryResponse>(key);
  if (cached) return cached;

  const cat = await prisma.categories.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!cat) throw new AppError(404, 'Category not found');

  await setInCache(key, cat);
  return cat;
};
