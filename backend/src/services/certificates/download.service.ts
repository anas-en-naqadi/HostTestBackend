// src/services/certificates/download.service.ts
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export const downloadCertificateService = async (enrollmentId: number, userId: number): Promise<{
  filePath: string;
  fileName: string;
}> => {
  // Find the certificate associated with the enrollment
  const certificate = await prisma.certificates.findFirst({
    where: { enrollment_id: enrollmentId },
    include: {
      enrollments: {
        include: {
          users: true,
          courses: true
        }
      }
    }
  });

  if (!certificate) {
    throw new Error("Certificate not found");
  }
  
  // Verify that the enrollment belongs to the requesting user
  if (certificate.enrollments.users.id !== userId) {
    throw new Error("Unauthorized access to certificate");
  }

  // Get the file path from the certificate URL
  // The certificate URL is stored as /certificates/CERT-XXXXX.pdf
  const certificateFileName = `${certificate.certificate_code}.pdf`;
  const filePath = path.join(process.cwd(), "certificates", certificateFileName);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new Error("Certificate file not found");
  }

  // Create a user-friendly file name for download
  const fileName = `Certificate_${certificate.enrollments.users.full_name}_${certificate.enrollments.courses.title}.pdf`
    .replace(/\s+/g, '_');

  return {
    filePath,
    fileName
  };
};
