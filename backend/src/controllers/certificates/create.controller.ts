// src/controllers/certificates/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createCertificate, regenerateCertificate } from '../../services/certificates/create.service';
import { AppError } from '../../middleware/error.middleware';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

export const createCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = user.id;
    const { enrollmentId } = req.body;

    if (!enrollmentId || isNaN(enrollmentId)) {
      res.status(400).json({
        success: false,
        message: 'Valid enrollment ID is required',
        data: null
      });
      return;
    }

    const certificate = await createCertificate(userId, Number(enrollmentId));
    
    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: {
        ...certificate,
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false,
        message: error.message 
      });
    } else if (error instanceof Error) {
      console.error('Create certificate error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      console.error('Create certificate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create certificate' 
      });
    }
  }
};

// Controller to download certificate PDF
export const downloadCertificateController = async (req: Request, res: Response) => {
  try {
    const { certificateCode } = req.params;
    const certificate = await prisma.certificates.findFirst({
      where: { certificate_code: certificateCode },
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
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const filePath = path.join(process.cwd(), 'certificates', certificate.certificate_url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Certificate file missing' });
    }

    const fileName = `Certificate_${certificate.enrollments.users.full_name}_${certificate.enrollments.courses.title}.pdf`
      .replace(/\s+/g, '_');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
};
// Controller to view certificate in browser
export const viewCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { certificateCode } = req.params;
    
    if (!certificateCode) {
      res.status(400).json({
        success: false,
        message: 'Certificate code is required'
      });
      return;
    }

    // Find certificate in database
    const certificate = await prisma.certificates.findFirst({
      where: { certificate_code: certificateCode }
    });

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
      return;
    }

    // Construct file path
    const filePath = path.join(process.cwd(), 'public', certificate.certificate_url);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'Certificate file not found'
      });
      return;
    }

    // Set headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('View certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view certificate'
    });
  }
};

// Controller to regenerate certificate (admin only)
export const regenerateCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role_id !== 1) { // Assuming role_id 1 is admin
      throw new AppError(403, 'Admin access required');
    }

    const { certificateId } = req.params;

    if (!certificateId || isNaN(Number(certificateId))) {
      res.status(400).json({
        success: false,
        message: 'Valid certificate ID is required'
      });
      return;
    }

    const certificate = await regenerateCertificate(Number(certificateId));
    
    res.status(200).json({
      success: true,
      message: 'Certificate regenerated successfully',
      data: certificate
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false,
        message: error.message 
      });
    } else if (error instanceof Error) {
      console.error('Regenerate certificate error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      console.error('Regenerate certificate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to regenerate certificate' 
      });
    }
  }
};

// Controller to automatically create certificate after quiz completion
export const autoCreateCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { enrollmentId, quizAttemptId } = req.body;

    if (!enrollmentId || !quizAttemptId) {
      res.status(400).json({
        success: false,
        message: 'Enrollment ID and quiz attempt ID are required'
      });
      return;
    }

    // Verify quiz attempt exists and was passed
    const quizAttempt = await prisma.quiz_attempts.findUnique({
      where: { id: quizAttemptId },
      include: {
        quizzes: true
      }
    });

    if (!quizAttempt || quizAttempt.user_id !== user.id || !quizAttempt.passed) {
      res.status(400).json({
        success: false,
        message: 'Quiz not passed or invalid attempt'
      });
      return;
    }

    // Check if it's a final quiz
    if (!quizAttempt.quizzes.isFinal) {
      res.status(400).json({
        success: false,
        message: 'Certificate can only be generated for final quiz completion'
      });
      return;
    }

    // Update enrollment completion status
    await prisma.enrollments.update({
      where: { id: enrollmentId },
      data: { 
        completed_at: new Date(),
        progress_percent: 100
      }
    });

    // Create certificate
    const certificate = await createCertificate(user.id, enrollmentId);
    
    // The certificate email is already sent from within createCertificate function
    
    res.status(201).json({
      success: true,
      message: 'Course completed! Certificate generated and email sent successfully',
      data: {
        ...certificate,
        downloadUrl: `${process.env.SERVER_URL}/api/certificates/download/${certificate.certificate_code}`,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificate_code}`
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false,
        message: error.message 
      });
    } else if (error instanceof Error) {
      console.error('Auto create certificate error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      console.error('Auto create certificate error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to auto create certificate' 
      });
    }
  }
};

// Controller to get user certificates
export const getUserCertificatesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const certificates = await prisma.certificates.findMany({
      where: {
        enrollments: {
          user_id: user.id
        }
      },
      include: {
        enrollments: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnail_url: true
              }
            },
            users: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      certificateCode: cert.certificate_code,
      certificateUrl: cert.certificate_url,
      createdAt: cert.created_at,
      course: cert.enrollments.courses,
      student: cert.enrollments.users,
      completedAt: cert.enrollments.completed_at
    }));

    res.status(200).json({
      success: true,
      message: 'Certificates retrieved successfully',
      data: formattedCertificates,
      count: formattedCertificates.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false,
        message: error.message 
      });
    } else {
      console.error('Get user certificates error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve certificates' 
      });
    }
  }
};

// Controller to verify certificate by code (public endpoint)
export const verifyCertificateController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { certificateCode } = req.params;
    
    if (!certificateCode) {
      res.status(400).json({
        success: false,
        message: 'Certificate code is required'
      });
      return;
    }

    // Find certificate with related data
    const certificate = await prisma.certificates.findFirst({
      where: { certificate_code: certificateCode },
      include: {
        enrollments: {
          include: {
            courses: {
              select: {
                id: true,
                title: true,
              }
            },
            users: {
              select: {
                id: true,
                full_name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid'
      });
      return;
    }

    // Format the response
    const verificationData = {
      isValid: true,
      certificateCode: certificate.certificate_code,
      completionDate: certificate.created_at,
      student: {
        name: certificate.enrollments.users.full_name,
        email: certificate.enrollments.users.email
      },
      course: {
        title: certificate.enrollments.courses.title,
      },
      organization: 'AcadeMe Learning Platform'
    };

    res.status(200).json({
      success: true,
      message: 'Certificate verified successfully',
      data: verificationData
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate'
    });
  }
};