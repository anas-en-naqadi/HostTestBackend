import { PrismaClient, certificates } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getCertificatesCacheKey = (userId: number) => `certificates:${userId}`;
const getCertificateByIdCacheKey = (id: number) => `certificate:${id}`;

export const updateCertificate = async (
  userId: number,
  id: number,
  data: { certificateUrl?: string; certificateCode?: string }
): Promise<certificates> => {
  const certificate = await prisma.certificates.findUnique({
    where: { id },
    include: { enrollments: true },
  });
  if (!certificate || certificate.enrollments.user_id !== userId) {
    throw new Error('Certificate not found or unauthorized');
  }

  const updatedCertificate = await prisma.certificates.update({
    where: { id },
    data: {
      certificate_url: data.certificateUrl,
      certificate_code: data.certificateCode,
      updated_at: new Date(),
    },
  });

  await redis.del(getCertificatesCacheKey(userId));
  await redis.del(getCertificateByIdCacheKey(id));
  return updatedCertificate;
};