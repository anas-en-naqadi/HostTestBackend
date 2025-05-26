import { PrismaClient, certificates } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getCertificateByIdCacheKey = (id: number) => `certificate:${id}`;

export const getCertificateById = async (userId: number, id: number): Promise<certificates> => {
  const cacheKey = getCertificateByIdCacheKey(id);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const certificate = await prisma.certificates.findUnique({
    where: { id },
    include: { enrollments: true },
  });
  if (!certificate || certificate.enrollments.user_id !== userId) {
    throw new Error('Certificate not found or unauthorized');
  }

  await redis.set(cacheKey, JSON.stringify(certificate), 'EX', 3600);
  return certificate;
};