// src/helpers/activityLogger.ts
import { PrismaClient } from '@prisma/client';
import {
  CACHE_KEYS,
  generateCacheKey,
  clearCacheByPrefix,
} from '../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Log an activity for a given user and clear cache.
 *
 * @param userId       The ID of the user performing the action
 * @param activityType A short code (e.g. "USER_LOGIN", "COURSE_CREATE")
 * @param details      Optional free‑text details
 * @param ipAddress    Optional IP address
 */
export async function logActivity(
  userId: number,
  activityType: string,
  details?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.activity_logs.create({
      data: {
        user_id: userId,
        activity_type: activityType,
        details,
        ip_address: ipAddress,
      },
    });

    // Invalidate the cache for activity logs list
    const key = generateCacheKey(CACHE_KEYS.ACTIVITY_LOGS, 'list');
    await clearCacheByPrefix(key);
  } catch (err) {
    console.error('Failed to log activity', { userId, activityType, err });
    // Cache failure shouldn't break flow
  }
}
