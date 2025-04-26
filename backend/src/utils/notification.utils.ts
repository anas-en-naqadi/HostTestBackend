// src/utils/notification.utils.ts

import { PrismaClient } from '@prisma/client';
import { SendNotificationDto,SendNotificationToAdminsDto } from '../types/notification.types';
import {
  CACHE_KEYS,
  generateCacheKey,
  clearCacheByPrefix,
} from './cache.utils';

const prisma = new PrismaClient();

/**
 * Send (create) an in‑app notification for a user.
 */
export async function sendNotification(dto: SendNotificationDto): Promise<void> {
  try {

    await prisma.notifications.create({
      data: {
        user_id: dto.user_id,
        title: dto.title,
        type: dto.type,
        content: dto.content,
        metadata: dto.metadata,
      },
    });
    const key = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, dto.user_id);
    await clearCacheByPrefix(key);
  } catch (err) {
    console.error('Failed to send notification', dto, err);
    // swallow errors so notification failures don't break your main flow
  }
}

/**
 * Notify all admins about a new intern registration or any other important event.
 */
export async function notifyAllAdmins(dto: SendNotificationToAdminsDto): Promise<void> {
  try {
    // Fetch all users with role 'admin'
    const admins = await prisma.users.findMany({
      where: {
        roles: {
          name: 'admin',
        },
      },
      select: {
        id: true,
      },
    });

    // Send notification to each admin
    await Promise.all(
      admins.map((admin) =>
        sendNotification({
          user_id: admin.id,
          title: dto.title,
          type: dto.type,
          content: dto.content,
          metadata: dto.metadata,
        })
      )
    );
  } catch (error) {
    console.error('❌ Error notifying admins:', error);
  }
}