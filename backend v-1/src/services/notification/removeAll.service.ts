import { PrismaClient } from '@prisma/client';
import {
  CACHE_KEYS,
  generateCacheKey,
  deleteFromCache,
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Remove all read notifications for a specific user
 */
export const removeAllReadNotifications = async (
  userId: number
): Promise<void> => {
  // Delete all read notifications for this user
   await prisma.notifications.deleteMany({
    where: { 
      user_id: userId,
      is_read: true 
    }
  });

  // Invalidate the notification cache for this user
  const cacheKey = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, userId);
  await deleteFromCache(cacheKey);

};