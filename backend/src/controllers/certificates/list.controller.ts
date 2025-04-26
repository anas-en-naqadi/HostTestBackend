// src/controllers/certificates/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getCertificates } from '../../services/certificates/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listCertificatesController = async (
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
    const certificates = await getCertificates(userId);
    res.status(200).json({ 
      success: true,
      message: 'Certificates retrieved successfully',
      data: certificates
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('List certificates error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve certificates' });
    }
  }
};