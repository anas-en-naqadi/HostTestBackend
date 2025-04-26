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

  // 2) Cache miss → fetch from DB
  console.log('Cache miss: querying notifications for user', userId);
  const raw = await prisma.notifications.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      user_id: true,
      title: true,
      type: true,
      content: true,
      metadata: true,
      is_read: true,
      created_at: true,
      read_at: true,
      users: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const notifications: NotificationResponse[] = raw.map(n => ({
    id: n.id,
    full_name: n.users.full_name,
    title: n.title,
    type: n.type,
    content: n.content ?? undefined,
    metadata: n.metadata ?? undefined,
    is_read: n.is_read ?? false,
    created_at: n.created_at!,
    read_at: n.read_at ?? undefined,
  }));

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const payload: NotificationListPayload = { notifications, unreadCount };

  // 3) Cache and return
  await setInCache(cacheKey, payload);

  return payload;
};
