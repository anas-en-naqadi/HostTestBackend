// src/controllers/certificates/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateCertificate } from '../../services/certificates/update.service';
import { AppError } from '../../middleware/error.middleware';

export const updateCertificateController = async (
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
    const id = parseInt(req.params.id, 10);
    const { certificateUrl, certificateCode } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid certificate ID',
        data: null
      });
      return;
    }

    const certificate = await updateCertificate(userId, id, { 
      certificateUrl, 
      certificateCode 
    });
    
    res.status(200).json({ 
      success: true,
      message: 'Certificate updated successfully',
      data: certificate
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Update certificate error:', error);
      res.status(500).json({ success: false, message: 'Failed to update certificate' });
    }
  }
};