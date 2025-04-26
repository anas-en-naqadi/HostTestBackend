import { PrismaClient, certificates } from '@prisma/client';
import redis from '../../config/redis';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const getCertificatesCacheKey = (userId: number) => `certificates:${userId}`;

export const createCertificate = async (userId: number, enrollmentId: number): Promise<certificates> => {
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: { courses: true },
  });
  if (!enrollment || enrollment.user_id !== userId) {
    throw new Error('Enrollment not found or user not enrolled');
  }

  const certificateCode = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`; // e.g., CERT-ABCD1234
  const certificateUrl = `https://example.com/certificates/${certificateCode}.pdf`; // Placeholder

  const certificate = await prisma.certificates.create({
    data: {
      enrollment_id: enrollmentId,
      certificate_url: certificateUrl,
      certificate_code: certificateCode,
    },
  });

  await redis.del(getCertificatesCacheKey(userId));
  return certificate;
};