import { PrismaClient, enrollments } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getEnrollmentsCacheKey = (userId: number) => `enrollments:${userId}`;

export const createEnrollment = async (
  userId: number,
  courseId: number
): Promise<enrollments> => {
  const courseExists = await prisma.courses.findUnique({ where: { id: courseId } });
  if (!courseExists) throw new Error('Course not found');

  const existingEnrollment = await prisma.enrollments.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
  });
  if (existingEnrollment) throw new Error('User already enrolled in this course');

  const enrollment = await prisma.enrollments.create({
    data: {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date(),
      progress_percent: 0,
    },
  });

  await redis.del(getEnrollmentsCacheKey(userId));
  return enrollment;
};