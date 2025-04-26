// src/controllers/quiz-attempts/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateQuizAttempt } from '../../services/quiz-attempts/update.service';
import { AppError } from '../../middleware/error.middleware';

export const updateQuizAttemptController = async (
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
    const { score, passed, completedAt } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid attempt ID',
        data: null
      });
      return;
    }

    const attempt = await updateQuizAttempt(userId, id, { score, passed, completedAt });
    res.status(200).json({ 
      success: true, 
      message: 'Quiz attempt updated successfully', 
      data: attempt 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Update quiz attempt error:', error);
      res.status(500).json({ success: false, message: 'Failed to update quiz attempt' });
    }
  }
};