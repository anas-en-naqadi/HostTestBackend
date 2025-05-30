// src/controllers/certificates/getById.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getCertificateById } from '../../services/certificates/getById.service';
import { AppError } from '../../middleware/error.middleware';

export const getCertificateByIdController = async (
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

    const certificate = await getCertificateById(userId, id);
    res.status(200).json({ 
      success: true,
      message: 'Certificate retrieved successfully',
      data: certificate
    });
  } catch (error) {
    const err = error as Error;
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ message: err.message });
    } else {
      console.error('Get certificate by ID error:', err.message);
      res.status(err.message.includes('not found') ? 404 : 500).json({ 
        success: false,
        message: 'Failed to retrieve certificate'
      });
    }
  }
};