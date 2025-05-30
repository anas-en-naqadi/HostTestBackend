// src/services/certificates/create.service.ts
import { PrismaClient, certificates } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { CertificateEmailService } from "./email.service";

const prisma = new PrismaClient();

interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateCode: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const generateCertificateHTML = (data: CertificateData): string => {
  const templatePath = path.join(__dirname, "../../templates/certificate.html");
  let template = fs.readFileSync(templatePath, "utf8");

  const imagePath = path.join(
    process.cwd(),
    "public/certificat_template/AcadeMeCertificate.jpg"
  );
  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  const backgroundImage = `data:image/png;base64,${imageBase64}`;

  return template
    .replace(/{{BACKGROUND_IMAGE}}/g, backgroundImage)
    .replace(/{{STUDENT_NAME}}/g, data.studentName)
    .replace(/{{COURSE_TITLE}}/g, data.courseTitle)
    .replace(/{{COMPLETION_DATE}}/g, data.completionDate)
    .replace(/{{CERTIFICATE_CODE}}/g, data.certificateCode);
};

const generatePDF = async (html: string, outputPath: string): Promise<void> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // ✅ Wait for all fonts and images to be fully loaded
    await page.evaluateHandle("document.fonts.ready");
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const images = Array.from(document.images);
        let loaded = 0;
        if (images.length === 0) return resolve();
        images.forEach((img) => {
          if (img.complete) {
            loaded++;
            if (loaded === images.length) resolve();
          } else {
            img.onload = () => {
              loaded++;
              if (loaded === images.length) resolve();
            };
            img.onerror = () => {
              loaded++;
              if (loaded === images.length) resolve();
            };
          }
        });
      });
    });

    await page.pdf({
      path: outputPath,
      width: "614px",
      height: "474px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
  }
};

export const createCertificate = async (
  userId: number,
  enrollmentId: number
): Promise<certificates> => {
  const enrollment = await prisma.enrollments.findUnique({
    where: { id: enrollmentId },
    include: {
      courses: true,
      users: true,
    },
  });

  if (!enrollment || enrollment.user_id !== userId) {
    throw new Error("Invalid enrollment");
  }

  if (!enrollment.completed_at) {
    throw new Error("Course not completed");
  }

  const certificateCode = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;

  const certificateData: CertificateData = {
    studentName: enrollment.users.full_name,
    courseTitle: enrollment.courses.title,
    completionDate: formatDate(enrollment.completed_at),
    certificateCode,
  };

  const certificateHTML = generateCertificateHTML(certificateData);

  const certificatesDir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }

  const fileName = `${certificateCode}.pdf`;
  const filePath = path.join(certificatesDir, fileName);

  await generatePDF(certificateHTML, filePath);

  const certificateUrl = `${process.env.SERVER_URL}/certificates/${fileName}`;

  // Create certificate in database
  const certificate = await prisma.certificates.create({
    data: {
      enrollment_id: enrollmentId,
      certificate_url: certificateUrl,
      certificate_code: certificateCode,
    },
  });

  // Send certificate email notification
  try {
    await CertificateEmailService.sendCertificateEmail(certificate.id);
    console.log(`Certificate email sent for certificate ID: ${certificate.id}`);
  } catch (emailError) {
    console.error("Failed to send certificate email:", emailError);
    // Don't throw error here - certificate creation should succeed even if email fails
  }

  return certificate;
};

// Create certificate directory if it doesn't exist
const ensureCertificateDirectory = (): string => {
  const certificatesDir = path.join(process.cwd(), "certificates");
  if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir, { recursive: true });
  }
  return certificatesDir;
};

// Optional: Function to regenerate certificate (if template changes)
export const regenerateCertificate = async (
  certificateId: number
): Promise<certificates> => {
  try {
    const certificate = await prisma.certificates.findUnique({
      where: { id: certificateId },
      include: {
        enrollments: {
          include: {
            courses: {
              include: {
                user: true,
              },
            },
            users: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }

    const enrollment = certificate.enrollments;

    // Prepare certificate data
    const certificateData: CertificateData = {
      studentName: enrollment.users.full_name,
      courseTitle: enrollment.courses.title,
      completionDate: formatDate(enrollment.completed_at!),
      certificateCode: certificate.certificate_code,
    };

    // Generate HTML and PDF
    const certificateHTML = generateCertificateHTML(certificateData);
    const certificatesDir = ensureCertificateDirectory();
    const fileName = `${certificate.certificate_code}.pdf`;
    const filePath = path.join(certificatesDir, fileName);

    await generatePDF(certificateHTML, filePath);

    return certificate;
  } catch (error) {
    console.error("Error regenerating certificate:", error);
    throw error;
  }
};
