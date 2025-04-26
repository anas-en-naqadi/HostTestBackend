// src/controllers/certificates/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createCertificate } from '../../services/certificates/create.service';
import { AppError } from '../../middleware/error.middleware';

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
      data: certificate
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Create certificate error:', error);
      res.status(500).json({ success: false, message: 'Failed to create certificate' });
    }
  }
};