import { PrismaClient, enrollments } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getEnrollmentCacheKey = (id: number) => `enrollment:${id}`;

export const getEnrollmentById = async (
  id: number,
  userId: number
): Promise<enrollments> => {
  const cacheKey = getEnrollmentCacheKey(id);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const enrollment = await prisma.enrollments.findUnique({
    where: { id },
    include: { courses: true },
  });

  if (!enrollment) throw new Error('Enrollment not found');
  if (enrollment.user_id !== userId) throw new Error('Unauthorized');

  await redis.set(cacheKey, JSON.stringify(enrollment), 'EX', 3600);
  return enrollment;
};