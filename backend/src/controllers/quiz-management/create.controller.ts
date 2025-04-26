import { Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { createQuizWithDetails } from '../../services/quiz-management/create.service';
import { AuthRequest } from '../../types/quiz.types';

export const createQuizController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const quizData = req.body;
    const quiz = await createQuizWithDetails(user.id, quizData);
    res.status(201).json({success: true, message:"Quiz Created successfully", data: quiz});
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Create quiz error:', error);
      res.status(500).json({success: false, message: 'Failed to create quiz' });
    }
  }
};