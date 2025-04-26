// src/controllers/lesson-progress/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createLessonProgress } from '../../services/lesson-progress/create.service';
import { AppError } from '../../middleware/error.middleware';

export const postLessonProgressController = async (
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
    const { lessonId, status } = req.body;

    if (!lessonId || isNaN(lessonId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid lesson ID is required',
        data: null
      });
      return;
    }

    const progress = await createLessonProgress(userId, Number(lessonId), status);
    res.status(201).json({ 
      success: true, 
      message: 'Lesson progress created successfully', 
      data: progress 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Create lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to create lesson progress' });
    }
  }
};