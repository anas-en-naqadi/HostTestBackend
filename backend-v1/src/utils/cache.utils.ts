import redis from '../config/redis';

/**
 * Cache key prefixes for different entities
 */
export const CACHE_KEYS = {
  USER: 'user',
  USERS: 'users',
  NOTIFICATIONS: 'notifications',
  CATEGORY: 'category',
  CATEGORIES: 'categories',
  INSTRUCTOR: 'instructor',
  INSTRUCTORS: 'instructors',
  COURSE: 'course',
  COURSES: 'courses',
  MODULE: 'module',
  MODULES: 'modules',
  LESSON: 'lesson',
  LESSONS: 'lessons',
  ROLE: 'role',
  ROLES: 'roles',
  ACTIVITY_LOGS: 'activity_logs',
} as const;

/**
 * Default cache TTL in seconds
 */
export const DEFAULT_TTL = 3600; // 1 hour

/**
 * Generate a cache key for a specific entity
 * @param prefix Cache key prefix
 * @param id Entity ID (optional)
 * @returns Formatted cache key
 */
export const generateCacheKey = (prefix: string, id?: number | string): string => {
  return id ? `${prefix}:${id}` : prefix;
};

/**
 * Get data from cache
 * @param key Cache key
 * @returns Parsed data or null if not found
 */
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set data in cache
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in seconds
 */
export const setInCache = async <T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

/**
 * Delete data from cache
 * @param key Cache key
 */
export const deleteFromCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

/**
 * Delete multiple keys from cache
 * @param pattern Key pattern to match
 */
export const deletePatternFromCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
};

/**
 * Clear all cache entries for a specific prefix
 * @param prefix Cache key prefix
 */
export const clearCacheByPrefix = async (prefix: string): Promise<void> => {
  try {
    // Delete the exact prefix key (e.g., 'users')
    await deleteFromCache(prefix);
    
    // Delete all keys with the prefix pattern (e.g., 'user:*')
    await deletePatternFromCache(`${prefix}:*`);
  } catch (error) {
    console.error('Cache clear prefix error:', error);
  }
}; 