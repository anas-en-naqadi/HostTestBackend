// src/controllers/lesson-progress/reset.controller.ts
import { Response, NextFunction, Request } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';
import { resetUserCourseProgress } from '../../services/lesson-progress/reset.service';

/**
 * Controller to reset all lesson progress for a user on a specific course
 * Requires authentication and appropriate permissions
 */
export const resetUserCourseProgressController = async (
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

    // Extract parameters from request
    const { userId, courseSlug } = req.params;
    
    // Validate parameters
    if (!userId || isNaN(Number(userId))) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid user ID is required',
        data: null
      });
      return;
    }
    
    if (!courseSlug) {
      res.status(400).json({ 
        success: false, 
        message: 'Course slug is required',
        data: null
      });
      return;
    }

    // Convert userId to number
    const userIdNum = Number(userId);
    
    // Call service to reset progress
    const result = await resetUserCourseProgress(userIdNum, courseSlug);

    // Log the activity
    logActivity(
      user.id,
      'LESSON_PROGRESS_RESET',
      `${user.full_name} reset progress for user ID ${userId} on course "${courseSlug}"`,
      req.ip
    ).catch(error => {
      console.log(error)
    });

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Course progress reset successfully', 
      data: result 
    });
  } catch (error) {
    console.log(error)
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to reset course progress' 
      });
    }
  }
};
