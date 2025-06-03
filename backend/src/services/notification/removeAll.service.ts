import { PrismaClient } from '@prisma/client';
import {
  CACHE_KEYS,
  generateCacheKey,
  deleteFromCache,
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Remove all read notifications for a specific user
 * @returns The number of notifications deleted
 */
export const removeAllReadNotifications = async (
  userId: number
): Promise<number> => {
  // Delete all read notifications for this user and get count
  const deleteResult = await prisma.notifications.deleteMany({
    where: { 
      user_id: userId,
      is_read: true 
    }
  });

  // Invalidate the notification cache for this user
  const cacheKey = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, userId);
  await deleteFromCache(cacheKey);

  return deleteResult.count;
};