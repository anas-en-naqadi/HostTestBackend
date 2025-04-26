// src/controllers/quiz-attempts/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createQuizAttempt } from '../../services/quiz-attempts/create.service';
import { AppError } from '../../middleware/error.middleware';

export const createQuizAttemptController = async (
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
    const { quizId } = req.body;

    if (!quizId || isNaN(quizId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid quiz ID is required',
        data: null
      });
      return;
    }

    const attempt = await createQuizAttempt(userId, Number(quizId));
    res.status(201).json({ 
      success: true, 
      message: 'Quiz attempt created successfully', 
      data: attempt 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Create quiz attempt error:', error);
      res.status(500).json({ success: false, message: 'Failed to create quiz attempt' });
    }
  }
};