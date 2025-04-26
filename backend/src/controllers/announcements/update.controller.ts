// src/controllers/announcements/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateAnnouncement } from '../../services/announcements/update.service';
import { AppError } from '../../middleware/error.middleware';

export const updateAnnouncementController = async (
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
    const { title, content } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid announcement ID',
        data: null
      });
      return;
    }

    if (!title || !content) {
      res.status(400).json({ 
        success: false,
        message: 'Title and content are required',
        data: null
      });
      return;
    }

    const announcement = await updateAnnouncement(userId, id, { title, content });
    res.status(200).json({ 
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error updating announcement:', error);
      res.status(500).json({ success: false, message: 'Failed to update announcement' });
    }
  }
};