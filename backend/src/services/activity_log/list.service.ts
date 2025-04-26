// src/services/activityLog/list.service.ts

import { PrismaClient } from '@prisma/client';
import { ActivityLogResponse } from '../../types/activity_log.types';
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Fetch all activity logs with caching, including the user who did each action.
 */
export const listActivityLogs = async (): Promise<ActivityLogResponse[]> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.ACTIVITY_LOGS, 'list');

  // 1) Try cache
  const cached = await getFromCache<ActivityLogResponse[]>(cacheKey);
  if (cached) {
    console.log('Cache hit: activity logs');
    return cached;
  }

  // 2) Cache miss → fetch from DB
  console.log('Cache miss: querying activity logs');
  const raw = await prisma.activity_logs.findMany({
    select: {
      id: true,
      user_id: true,
      activity_type: true,
      details: true,
      ip_address: true,
      created_at: true,
      updated_at: true,
      users: {                     // <-- nest the relation here
        select: {
          id: true,
          full_name: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // 3) Map into ActivityLogResponse
  const logs: ActivityLogResponse[] = raw.map(l => ({
    id: l.id,
    user_id: l.user_id,
    activity_type: l.activity_type,
    details: l.details ?? undefined,
    ip_address: l.ip_address ?? undefined,
    created_at: l.created_at!,
    actor_full_name: l.users.full_name,
  }));

  // 4) Cache and return
  await setInCache(cacheKey, logs);
  return logs;
};
