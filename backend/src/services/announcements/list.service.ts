import { PrismaClient, announcements } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getAnnouncementsCacheKey = (userId: number) => `announcements:${userId}`;

export const getAnnouncements = async (userId: number): Promise<announcements[]> => {
  const cacheKey = getAnnouncementsCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  // console.log('Cache check:', cacheKey, 'Cached:', cachedData);
  if (cachedData) return JSON.parse(cachedData);

  const instructorIds = (await prisma.instructors.findMany({ where: { user_id: userId }, select: { id: true } })).map(i => i.id);
  console.log('Instructor IDs for user', userId, ':', instructorIds);

  const announcements = await prisma.announcements.findMany({
    where: {
      OR: [
        { courses: { enrollments: { some: { user_id: userId } } } },
        { courses: { instructor_id: { in: instructorIds } } },
      ],
    },
  });

  console.log('Found announcements:', announcements);
  await redis.set(cacheKey, JSON.stringify(announcements), 'EX', 3600);
  return announcements;
};