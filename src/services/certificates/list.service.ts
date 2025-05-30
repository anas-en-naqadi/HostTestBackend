import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getCertificatesCacheKey = (userId: number) => `certificates:${userId}`;

// Define the type for enrollment with course data that can be used for certificates
type EnrollmentWithCourseData = Array<{
  id: number;
  progress_percent: number | null;
  courses: {
    id: number;
    title: string;
    thumbnail_url: string;
    slug: string;
  };
}>;

export const getCertificates = async (userId: number): Promise<EnrollmentWithCourseData> => {
  const cacheKey = getCertificatesCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  // Query enrollments directly instead of certificates
  const enrollments = await prisma.enrollments.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      progress_percent: true,
      courses: {
        select: {
          id: true,
          title: true,
          thumbnail_url: true,
          slug: true,
        }
      }
    }
  });

  await redis.set(cacheKey, JSON.stringify(enrollments));
  return enrollments;
};