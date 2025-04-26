// src/controllers/announcements/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createAnnouncement } from '../../services/announcements/create.service';
import { AppError } from '../../middleware/error.middleware';

export const createAnnouncementController = async (
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
    const { courseId, title, content } = req.body;

    if (!courseId || isNaN(courseId)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid course ID is required',
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

    const announcement = await createAnnouncement(userId, { 
      courseId: Number(courseId),
      title,
      content
    });

    res.status(201).json({ 
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Create announcement error:', error);
      res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
  }
};