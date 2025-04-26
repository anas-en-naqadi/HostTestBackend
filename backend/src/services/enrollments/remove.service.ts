import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getEnrollmentsCacheKey = (userId: number) => `enrollments:${userId}`;
const getEnrollmentCacheKey = (id: number) => `enrollment:${id}`;

export const deleteEnrollment = async (
  id: number,
  userId: number
): Promise<void> => {
  const enrollment = await prisma.enrollments.findUnique({ where: { id } });
  if (!enrollment) throw new Error('Enrollment not found');
  if (enrollment.user_id !== userId) throw new Error('Unauthorized');

  await prisma.enrollments.delete({ where: { id } });
  await redis.del(getEnrollmentCacheKey(id));
  await redis.del(getEnrollmentsCacheKey(userId));
};