import { Request, Response, NextFunction } from 'express';
import { validateAnswerService } from '../../services/quiz-management/validateAnswer.service';
import { AppError } from '../../middleware/error.middleware';

export const validateAnswerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId, questionId, optionId } = req.body;
    if (!quizId || !questionId || !optionId) {
      throw new AppError(400, 'quizId, questionId, and optionId are required');
    }
    const isCorrect = await validateAnswerService(Number(quizId), Number(questionId), Number(optionId));
    res.status(200).json({ success: true, isCorrect });
  } catch (error) {
    next(error);
  }
};
