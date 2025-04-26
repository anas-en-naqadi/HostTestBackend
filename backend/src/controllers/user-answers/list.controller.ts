// src/controllers/user-answers/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getUserAnswers } from '../../services/user-answers/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listUserAnswersController = async (
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
    const answers = await getUserAnswers(userId);
    res.status(200).json({ 
      success: true,
      message: 'User answers retrieved successfully',
      data: answers
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('List user answers error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve user answers' });
    }
  }
};