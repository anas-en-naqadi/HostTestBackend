import { PrismaClient, certificates } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getCertificatesCacheKey = (userId: number) => `certificates:${userId}`;

export const getCertificates = async (userId: number): Promise<certificates[]> => {
  const cacheKey = getCertificatesCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const certificates = await prisma.certificates.findMany({
    where: {
      enrollments: { user_id: userId }, // Only user's certificates
    },
  });

  await redis.set(cacheKey, JSON.stringify(certificates), 'EX', 3600);
  return certificates;
};