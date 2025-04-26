import { PrismaClient, announcements } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getAnnouncementsCacheKey = (userId: number) => `announcements:${userId}`;

export const createAnnouncement = async (
  userId: number,
  data: { courseId: number; title: string; content: string }
): Promise<announcements> => {
  const course = await prisma.courses.findUnique({
    where: { id: data.courseId },
    include: { instructors: true },
  });
  if (!course || course.instructors?.user_id !== userId) {
    throw new Error('Course not found or user is not the instructor');
  }

  const announcement = await prisma.announcements.create({
    data: {
      course_id: data.courseId,
      publisher_id: userId,
      title: data.title,
      content: data.content,
    },
  });

  // Invalidate cache for enrolled users
  const enrolledUsers = await prisma.enrollments.findMany({
    where: { course_id: data.courseId },
    select: { user_id: true },
  });
  for (const { user_id } of enrolledUsers) {
    await redis.del(getAnnouncementsCacheKey(user_id));
  }
  // Invalidate cache for the instructor
  await redis.del(getAnnouncementsCacheKey(userId));

  return announcement;
};