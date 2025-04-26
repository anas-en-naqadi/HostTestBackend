// src/services/category/list.service.ts

import { PrismaClient } from '@prisma/client';
import { CategoryResponse } from '../../types/category.types';
import { CACHE_KEYS, generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * List all categories with caching
 */
export const listCategories = async (): Promise<CategoryResponse[]> => {
  // Generate a cache key for the list of categories
  const cacheKey = generateCacheKey(CACHE_KEYS.CATEGORIES);

  // Try to fetch the data from the cache
  const cachedCategories = await getFromCache<CategoryResponse[]>(cacheKey);
  
  if (cachedCategories) {
    // If the data exists in cache, return it
    console.log('Cache hit: categories found in cache');
    return cachedCategories;
  }

  // If no data in cache, query the database
  console.log('Cache miss: querying the database');
  const categories = await prisma.categories.findMany({
    select: { id: true, name: true, slug: true },
  });

  // Store the result in the cache with an expiration time (e.g., 1 hour)
  await setInCache(cacheKey, categories, 3600); // 1 hour expiration time
  
  return categories;
};
