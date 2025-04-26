import { Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { getQuizzes } from '../../services/quiz-management/list.service';
import { AuthRequest } from '../../types/quiz.types';

export const listQuizzesController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const quizzes = await getQuizzes(user.id);
    res.status(200).json({ success: true, message:"Data fetched successfully", data: quizzes });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('List quizzes error:', error);
      res.status(500).json({ succes: false, message: 'Failed to list quizzes' });
    }
  }
};