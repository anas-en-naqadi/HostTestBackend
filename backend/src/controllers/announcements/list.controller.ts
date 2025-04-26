// src/controllers/announcements/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getAnnouncements } from '../../services/announcements/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listAnnouncementsController = async (
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
    const announcements = await getAnnouncements(userId);
    res.status(200).json({ 
      success: true,
      message: 'Announcements retrieved successfully',
      data: announcements
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error listing announcements:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve announcements' });
    }
  }
};