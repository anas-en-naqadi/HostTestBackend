// src/utils/notification.utils.ts

import { PrismaClient } from '@prisma/client';
import { 
  SendNotificationDto, 
  SendNotificationToAdminsDto 
} from '../types/notification.types';
import {
  CACHE_KEYS,
  generateCacheKey,
  clearCacheByPrefix,
  deleteFromCache,
} from './cache.utils';

// Create a single Prisma client instance
const prisma = new PrismaClient();

/**
 * Send (create) an in-app notification for a user
 * @param dto - Notification data transfer object
 * @param role - Optional role context for notification
 */
export async function sendNotification(
  dto: SendNotificationDto, 
  userId:number,
  role?: string,

): Promise<void> {
  try {
    // Fetch roles concurrently with other operations
    const [roles, userRoles] = await Promise.all([
      prisma.roles.findMany({ select: { id: true, name: true } }),
      prisma.users.findUnique({ 
        where: { id: dto.user_id }, 
        select: { role_id: true } 
      })
    ]);

    if (!userRoles) {
      console.warn(`No user found with ID: ${dto.user_id}`);
      return;
    }

    // Notification logic based on role
    switch (role) {
      case 'instructor':
        await handleInstructorNotification(dto,userId, roles);
        break;
      case 'intern':
        await handleInternNotification(dto,userId);
        break;
      default:
        // Direct notification if no specific role handling
        await createDirectNotification(dto,userId);
    }

    // Clear notification cache
    const key = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, dto.user_id);
    await clearCacheByPrefix(key);

  } catch (err) {
    console.error('Failed to send notification', { dto, error: err });
  }
}

/**
 * Handle notification logic for instructors
 * @param dto - Notification data
 * @param roles - Available system roles
 */
async function handleInstructorNotification(
  dto: SendNotificationDto, 
  userId:number,
  roles: Array<{ id: number; name: string }>
): Promise<void> {
  let enrollments;
  
  if (dto.type.toLowerCase() === 'announcement') {
    enrollments = await prisma.enrollments.findMany({
      where: { course_id: { in: dto.metadata.courseId } },
      distinct: ['user_id'],
      select: { user_id: true }
    });
  } else {
    const courses = await prisma.courses.findMany({
      where: { instructor_id: dto.user_id },
      select: { id: true }
    });
    
    const courseIds = courses.map(c => c.id);
    if (courseIds.length === 0) return;

    enrollments = await prisma.enrollments.findMany({
      where: { course_id: { in: courseIds } },
      distinct: ['user_id'],
      select: { user_id: true }
    });
  }

  const internIds = enrollments.map(e => e.user_id);
  if (internIds.length === 0) return;

  const internRole = roles.find(r => r.name === 'intern');
  if (!internRole) {
    throw new Error("No 'intern' role configured in the system");
  }

  const internUsers = await prisma.users.findMany({
    where: {
      id: { in: internIds },
      role_id: internRole.id
    },
    select: { id: true }
  });

  await Promise.all([
    ...internUsers.map(u => 
      createDirectNotification({
        ...dto,
        user_id: u.id
      },userId)
    ),
    notifyAllAdmins(dto,userId)
  ]);
}

/**
 * Handle notification logic for interns
 * @param dto - Notification data
 */
async function handleInternNotification(dto: SendNotificationDto,userId:number): Promise<void> {
  const instructor = await prisma.instructors.findUnique({
    where: { user_id: dto.user_id },
    select: { user_id: true }
  });

  if (instructor) {
    await createDirectNotification({
      ...dto,
      user_id: instructor.user_id
    },userId);
    await notifyAllAdmins(dto,userId);
  }
}

/**
 * Create a direct notification for a specific user
 * @param dto - Notification data
 */
async function createDirectNotification(dto: SendNotificationDto,userId:number): Promise<void> {
   const cacheKey = generateCacheKey(CACHE_KEYS.NOTIFICATIONS, userId);
    await deleteFromCache(cacheKey);
  await prisma.notifications.create({
    data: {
      user_id: dto.user_id,
      title: dto.title,
      type: dto.type,
      content: dto.content,
      metadata: dto.metadata,
    },
  });
}

/**
 * Notify all admins about a new event
 * @param dto - Notification data for admins
 */
export async function notifyAllAdmins(dto: SendNotificationToAdminsDto,userId:number): Promise<void> {
  try {
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

    await Promise.all(
      admins.map(admin => 
        createDirectNotification({
          user_id: admin.id,
          title: dto.title,
          type: dto.type,
          content: dto.content,
          metadata: dto.metadata,
        },userId)
      )
    );
  } catch (error) {
    console.error('❌ Error notifying admins:', error);
  }
}