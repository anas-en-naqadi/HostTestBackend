// src/controllers/announcements/getById.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getAnnouncementById } from '../../services/announcements/getById.service';
import { AppError } from '../../middleware/error.middleware';

export const getAnnouncementByIdController = async (
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
        message: 'Invalid announcement ID',
        data: null
      });
      return;
    }

    const announcement = await getAnnouncementById(userId, id);
    res.status(200).json({ 
      success: true,
      message: 'Announcement retrieved successfully',
      data: announcement
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error getting announcement by ID:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve announcement' });
    }
  }
};