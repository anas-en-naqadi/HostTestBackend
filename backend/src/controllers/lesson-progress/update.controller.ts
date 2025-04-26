// src/controllers/lesson-progress/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateLessonProgress } from '../../services/lesson-progress/update.service';
import { AppError } from '../../middleware/error.middleware';

export const putLessonProgressController = async (
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
    const { status, completedAt } = req.body;

    if (isNaN(lessonId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid lesson ID',
        data: null
      });
      return;
    }

    const progress = await updateLessonProgress(userId, lessonId, { status, completedAt });
    res.status(200).json({ 
      success: true, 
      message: 'Lesson progress updated successfully', 
      data: progress 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Update lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to update lesson progress' });
    }
  }
};