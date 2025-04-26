// src/controllers/lesson-progress/remove.controller.ts
import { Response, NextFunction, Request } from 'express';
import { deleteLessonProgress } from '../../services/lesson-progress/remove.service';
import { AppError } from '../../middleware/error.middleware';

export const deleteLessonProgressController = async (
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

    await deleteLessonProgress(userId, lessonId);
    res.status(200).json({ 
      success: true, 
      message: 'Lesson progress deleted successfully', 
      data: null 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Delete lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete lesson progress' });
    }
  }
};