import { PrismaClient, enrollments } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getEnrollmentsCacheKey = (userId: number) => `enrollments:${userId}`;

export const getEnrollments = async (userId: number): Promise<enrollments[]> => {
  const cacheKey = getEnrollmentsCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const enrollments = await prisma.enrollments.findMany({
    where: { user_id: userId },
    include: { courses: true },
  });

  await redis.set(cacheKey, JSON.stringify(enrollments), 'EX', 3600);
  return enrollments;
};