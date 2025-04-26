// src/controllers/lesson-progress/getById.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getLessonProgressById } from '../../services/lesson-progress/getById.service';
import { AppError } from '../../middleware/error.middleware';

export const getLessonProgressByIdController = async (
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
    const lessonId = parseInt(req.params.lessonId, 10);

    if (isNaN(lessonId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid lesson ID',
        data: null
      });
      return;
    }

    const progress = await getLessonProgressById(userId, lessonId);
    res.status(200).json({ 
      success: true, 
      message: 'Lesson progress retrieved successfully', 
      data: progress 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Get lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve lesson progress' });
    }
  }
};