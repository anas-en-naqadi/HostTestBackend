// src/controllers/quiz-attempts/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getQuizAttempts } from '../../services/quiz-attempts/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listQuizAttemptsController = async (
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
    const quizId = req.query.quizId ? parseInt(req.query.quizId as string, 10) : undefined;

    if (quizId && isNaN(quizId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid quiz ID is required',
        data: null
      });
      return;
    }

    const attempts = await getQuizAttempts(userId, quizId);
    res.status(200).json({ 
      success: true, 
      message: 'Quiz attempts retrieved successfully', 
      data: attempts 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('List quiz attempts error:', error);
      res.status(500).json({ success: false, message: 'Failed to list quiz attempts' });
    }
  }
};