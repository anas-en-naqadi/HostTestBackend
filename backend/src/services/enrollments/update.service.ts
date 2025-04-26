import { PrismaClient, enrollments } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getEnrollmentsCacheKey = (userId: number) => `enrollments:${userId}`;
const getEnrollmentCacheKey = (id: number) => `enrollment:${id}`;

export const updateEnrollmentProgress = async (
  id: number,
  userId: number,
  progressPercent: number
): Promise<enrollments> => {
  const enrollment = await prisma.enrollments.findUnique({ where: { id } });
  if (!enrollment) throw new Error('Enrollment not found');
  if (enrollment.user_id !== userId) throw new Error('Unauthorized');

  if (progressPercent < 0 || progressPercent > 100) {
    throw new Error('Progress percent must be between 0 and 100');
  }

  const updatedEnrollment = await prisma.enrollments.update({
    where: { id },
    data: { progress_percent: progressPercent },
  });

  await redis.del(getEnrollmentCacheKey(id));
  await redis.del(getEnrollmentsCacheKey(userId));
  return updatedEnrollment;
};