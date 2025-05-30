import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getCertificatesCacheKey = (userId: number) => `certificates:${userId}`;
const getCertificateByIdCacheKey = (id: number) => `certificate:${id}`;

export const deleteCertificate = async (userId: number, id: number): Promise<void> => {
  const certificate = await prisma.certificates.findUnique({
    where: { id },
    include: { enrollments: true },
  });
  if (!certificate || certificate.enrollments.user_id !== userId) {
    throw new Error('Certificate not found or unauthorized');
  }

  await prisma.certificates.delete({ where: { id } });
  await redis.del(getCertificatesCacheKey(userId));
  await redis.del(getCertificateByIdCacheKey(id));
};