import { PrismaClient } from '@prisma/client';
import {
  CACHE_KEYS,
  deleteFromCache,
  generateCacheKey,
  
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Mark all notifications as read for a specific user
 * @returns The number of notifications marked as read
 */
export const markAllNotificationsAsRead = async (
  userId: number
): Promise<number> => {
  // Update all unread notifications for this user
  const result = await prisma.notifications.updateMany({
    where: { 
      user_id: userId,
      is_read: false 
    },
    data: { 
      is_read: true 
    }
  });

  // Invalidate the notification cache for this user
  const cacheKey = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, userId);
  await deleteFromCache(cacheKey);

  return result.count;
};