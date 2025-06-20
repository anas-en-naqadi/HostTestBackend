// src/controllers/lesson-progress/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createLessonProgress } from '../../services/lesson-progress/create.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

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
    const { lesson_id,slug,completed_at } = req.body;
    const lessonId = lesson_id;
    if (!lessonId || isNaN(lessonId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid lesson ID is required',
        data: null
      });
      return;
    }
    if (!slug) {
      res.status(400).json({ 
        success: false, 
        message: 'slug is required',
        data: null
      });
      return;
    }

    const progress = await createLessonProgress(userId, Number(lessonId),slug,completed_at);

    logActivity(
      userId,
      'LESSON_PROGRESS_CREATE',
      `${user.full_name} completed progress for lesson ID ${lessonId} (course slug "${slug}")`,
      req.ip
    ).catch(console.error);

    res.status(201).json({ 
      success: true, 
      message: 'Lesson progress created successfully', 
      data: progress 
    });
  } catch (error) {
    console.log(error)
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Create lesson progress error:', error);
      res.status(500).json({ success: false, message: 'Failed to create lesson progress' });
    }
  }
};