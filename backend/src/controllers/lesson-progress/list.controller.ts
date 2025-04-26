// src/controllers/lesson-progress/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getLessonProgress } from '../../services/lesson-progress/list.service';
import { AppError } from '../../middleware/error.middleware';

export const getLessonProgressController = async (
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
    const progress = await getLessonProgress(userId);
    res.status(200).json({ 
      success: true, 
      message: 'Lesson progress retrieved successfully', 
      data: progress 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('List lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to list lesson progress' });
    }
  }
};