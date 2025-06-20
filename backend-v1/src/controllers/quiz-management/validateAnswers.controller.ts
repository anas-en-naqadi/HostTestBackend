import { Request, Response, NextFunction } from 'express';
import { validateAnswersService } from '../../services/quiz-management/validateAnswers.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

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
    
    // Calculate score
    const score = results.filter(r => r.isCorrect).length;
    const total = results.length;
    
    // Log activity if user is authenticated
    if (req.user) {
      logActivity(
        req.user.id,
        'QUIZ_ANSWERS_SUBMITTED',
        `${req.user.full_name} submitted ${total} answers for quiz ID ${quizId} with score ${score}/${total} (${Math.round((score/total)*100)}%)`,
        req.ip
      ).catch(console.error);
    }
    
    res.status(200).json({ 
      success: true, 
      results,
      // Calculate overall score
      score,
      total
    });
  } catch (error) {
    next(error);
  }
};
