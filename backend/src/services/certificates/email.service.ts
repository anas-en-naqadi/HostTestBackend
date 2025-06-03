// src/services/certificates/email.service.ts
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "../../utils/email.utils";
import { AppError } from "../../middleware/error.middleware";

const prisma = new PrismaClient();

interface CertificateEmailTemplateData {
  studentName: string;
  courseTitle: string;
  certificateCode: string;
  downloadUrl: string;
  completionDate: string;
  platformName: string;
  supportEmail: string;
  currentYear: number;
}

export class CertificateEmailService {
  private static generateCertificateEmailTemplate(data: CertificateEmailTemplateData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Ready - ${data.platformName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
                font-size: 28px;
            }
            .congratulations {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 30px;
            }
            .congratulations h2 {
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            .certificate-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #28a745;
            }
            .certificate-info h3 {
                color: #28a745;
                margin: 0 0 15px 0;
            }
            .info-item {
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .info-item:last-child {
                border-bottom: none;
            }
            .info-label {
                font-weight: bold;
                color: #495057;
                display: inline-block;
                width: 140px;
            }
            .info-value {
                color: #333;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                margin: 10px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                font-size: 16px;
                transition: background-color 0.3s;
            }
            .btn-primary {
                background-color: #007bff !important;
                color: #ffffff !important;
                text-decoration: none !important;
            }
            .btn-primary:hover {
                background-color: #0056b3 !important;
                color: #ffffff !important;
            }
            .btn-primary:visited {
                color: #ffffff !important;
            }
            .btn-primary:active {
                color: #ffffff !important;
            }
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background-color: #545b62;
            }
            .certificate-code {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
                margin: 20px 0;
            }
            .certificate-code strong {
                font-size: 18px;
                color: #856404;
                font-family: monospace;
            }
            .verification-info {
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                color: #6c757d;
                font-size: 14px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                color: #007bff;
                text-decoration: none;
                margin: 0 10px;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
                .btn {
                    display: block;
                    margin: 10px 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${data.platformName}</h1>
                <p>Online Learning Platform</p>
            </div>

            <div class="congratulations">
                <h2>🎉 Congratulations, ${data.studentName}!</h2>
                <p>Your certificate is ready for download</p>
            </div>

            <div class="certificate-info">
                <h3>📜 Certificate Details</h3>
                <div class="info-item">
                    <span class="info-label">Course:</span>
                    <span class="info-value">${data.courseTitle}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Student:</span>
                    <span class="info-value">${data.studentName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Completion Date:</span>
                    <span class="info-value">${data.completionDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Certificate ID:</span>
                    <span class="info-value">${data.certificateCode}</span>
                </div>
            </div>

            <div class="certificate-code">
                <p><strong>Certificate Code: ${data.certificateCode}</strong></p>
                <small>Save this code for verification purposes</small>
            </div>

            <div class="button-container">
                <a href="${data.downloadUrl}" class="btn btn-primary">
                    📥 Download Certificate
                </a>
            </div>

            <div class="verification-info">
                <h4>🔐 Certificate Verification</h4>
                <p>Your certificate can be verified using the certificate code <strong>${data.certificateCode}</strong> 
                   or by visiting the verification link above. This ensures the authenticity of your achievement.</p>
            </div>

            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #0066cc; margin: 0 0 10px 0;">🚀 What's Next?</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Add this certificate to your LinkedIn profile</li>
                    <li>Share your achievement on social media</li>
                    <li>Include it in your professional portfolio</li>
                    <li>Explore more courses to advance your skills</li>
                </ul>
            </div>

            <div class="footer">
                <p>Thank you for choosing ${data.platformName} for your learning journey!</p>
                <div class="social-links">
                    <a href="#">LinkedIn</a> |
                    <a href="#">Twitter</a> |
                    <a href="#">Facebook</a>
                </div>
                <p>
                    Need help? Contact us at 
                    <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>
                </p>
                <p>&copy; ${data.currentYear} ${data.platformName}. All rights reserved.</p>
                <small>
                    This email was sent regarding your course completion. 
                    Please do not reply to this automated email.
                </small>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  static async sendCertificateEmail(certificateId: number): Promise<void> {
    try {
      // Find certificate with related data
      const certificate = await prisma.certificates.findUnique({
        where: { id: certificateId },
        include: {
          enrollments: {
            include: {
              courses: {
                select: {
                  id: true,
                  title: true,
                },
              },
              users: {
                select: {
                  id: true,
                  email: true,
                  full_name: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        throw new AppError(404, "Certificate not found");
      }

      const { enrollments } = certificate;
      const user = enrollments.users;
      const course = enrollments.courses;

      // Generate URLs
      const downloadUrl = `${process.env.SERVER_URL}/certificates/${certificate.certificate_code}.pdf`;

      // Format completion date
      const completionDate = enrollments.completed_at 
        ? new Date(enrollments.completed_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";

      // Prepare template data
      const templateData: CertificateEmailTemplateData = {
        studentName: user.full_name,
        courseTitle: course.title,
        certificateCode: certificate.certificate_code,
        downloadUrl,
        completionDate,
        platformName: "Forge",
        supportEmail: process.env.SUPPORT_EMAIL || "support@forge.com",
        currentYear: new Date().getFullYear(),
      };

      // Generate HTML content from template
      const htmlContent = this.generateCertificateEmailTemplate(templateData);

      // Send email
      await sendEmail({
        to: user.email,
        subject: `🎉 Your Certificate is Ready - ${course.title}`,
        html: htmlContent,
      });

      console.log(`Certificate email sent to ${user.email} for certificate ${certificate.certificate_code}`);
    } catch (error) {
      console.error("Error sending certificate email:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to send certificate email");
    }
  }

  // Alternative method to send email with PDF attachment
  static async sendCertificateEmailWithAttachment(certificateId: number): Promise<void> {
    try {
      const certificate = await prisma.certificates.findUnique({
        where: { id: certificateId },
        include: {
          enrollments: {
            include: {
              courses: {
                select: {
                  id: true,
                  title: true,
                },
              },
              users: {
                select: {
                  id: true,
                  email: true,
                  full_name: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        throw new AppError(404, "Certificate not found");
      }

      // Note: To send with attachment, you'll need to modify the sendEmail utility
      // to accept attachments parameter. For now, we'll send with download link.
      await this.sendCertificateEmail(certificateId);
      
    } catch (error) {
      console.error("Error sending certificate email with attachment:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to send certificate email with attachment");
    }
  }
}