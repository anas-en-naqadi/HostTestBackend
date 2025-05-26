import { PrismaClient, announcements } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getAnnouncementByIdCacheKey = (id: number) => `announcement:${id}`;

export const getAnnouncementById = async (userId: number, id: number): Promise<announcements> => {
  const cacheKey = getAnnouncementByIdCacheKey(id);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const announcement = await prisma.announcements.findUnique({
    where: { id },
    include: { courses: { include: { enrollments: true, user: {select:{id:true}} } } },
  });

  const isEnrolled = announcement?.courses.enrollments.some(e => e.user_id === userId);
  const isInstructor = announcement?.courses.user?.id === userId;

  if (!announcement || (!isEnrolled && !isInstructor)) {
    throw new Error('Announcement not found or user not enrolled in the course');
  }

  await redis.set(cacheKey, JSON.stringify(announcement), 'EX', 3600);
  return announcement;
};