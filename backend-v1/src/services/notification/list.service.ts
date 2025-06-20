import { PrismaClient } from '@prisma/client';
import { NotificationResponse } from '../../types/notification.types';
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

export interface NotificationListPayload {
  notifications: NotificationResponse[];
  unreadCount: number;
}

/**
 * Fetch all notifications for a given user, with caching.
 */
export const listNotifications = async (
  userId: number
): Promise<NotificationListPayload> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, userId);

  // 1) Try cache
  const cached = await getFromCache<NotificationListPayload>(cacheKey);
  if (cached) {
    console.log('Cache hit: notifications for user', userId);
    return cached;
  }

  const raw = await prisma.notifications.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      title: true,
      type: true,
      content: true,
      metadata: true,
      created_at: true,
      is_read:true,
    },
    orderBy: { created_at: 'desc' },
  });

  const notifications: NotificationResponse[] = raw.map(r => ({
    id:         r.id,
    title:      r.title,
    type:       r.type,
    content:    r.content!,      // assert non-null
    metadata:   r.metadata!,     // assert non-null
    created_at: r.created_at!,   // assert non-null
  }));


  const unreadCount = notifications.filter(n => !n.is_read).length;

  const payload: NotificationListPayload = { notifications, unreadCount };

  // 3) Cache and return
  await setInCache(cacheKey, payload);

  return payload;
};
