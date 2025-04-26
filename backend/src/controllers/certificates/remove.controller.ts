// src/controllers/certificates/remove.controller.ts
import { Response, NextFunction, Request } from 'express';
import { deleteCertificate } from '../../services/certificates/remove.service';
import { AppError } from '../../middleware/error.middleware';

export const removeCertificateController = async (
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

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid certificate ID',
        data: null
      });
      return;
    }

    await deleteCertificate(userId, id);
    res.status(200).json({ 
      success: true,
      message: 'Certificate deleted successfully',
      data: null
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Delete certificate error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete certificate' });
    }
  }
};