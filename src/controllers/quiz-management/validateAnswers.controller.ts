import { Request, Response, NextFunction } from 'express';
import { validateAnswersService } from '../../services/quiz-management/validateAnswers.service';
import { AppError } from '../../middleware/error.middleware';

export const validateAnswersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers) || answers.length === 0) {
      throw new AppError(400, 'quizId and a non-empty answers array are required');
    }
    
    // Validate each answer has the required properties
    for (const answer of answers) {
      if (!answer.questionId || !answer.optionId) {
        throw new AppError(400, 'Each answer must have questionId and optionId');
      }
    }
    
    const results = await validateAnswersService(Number(quizId), answers);
    
    res.status(200).json({ 
      success: true, 
      results,
      // Calculate overall score
      score: results.filter(r => r.isCorrect).length,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
};
