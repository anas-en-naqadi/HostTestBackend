import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getAnnouncementsCacheKey = (userId: number) => `announcements:${userId}`;
const getAnnouncementByIdCacheKey = (id: number) => `announcement:${id}`;

export const deleteAnnouncement = async (userId: number, id: number): Promise<void> => {
  const announcement = await prisma.announcements.findUnique({
    where: { id },
    include: { courses: { include: { instructors: true } } },
  });
  if (!announcement || announcement.courses.instructors?.user_id !== userId) {
    throw new Error('Announcement not found or unauthorized');
  }

  await prisma.announcements.delete({ where: { id } });

  const enrolledUsers = await prisma.enrollments.findMany({
    where: { course_id: announcement.course_id },
    select: { user_id: true },
  });
  for (const { user_id } of enrolledUsers) {
    await redis.del(getAnnouncementsCacheKey(user_id));
  }
  await redis.del(getAnnouncementsCacheKey(userId)); // Add this
  await redis.del(getAnnouncementByIdCacheKey(id));
};