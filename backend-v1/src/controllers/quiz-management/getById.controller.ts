import { Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { getQuizById } from '../../services/quiz-management/getById.service';
import { AuthRequest } from '../../types/quiz.types';
import { logActivity } from '../../utils/activity_log.utils';

export const getQuizByIdController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const quizId = parseInt(req.params.id, 10);
    const quiz = await getQuizById(user.id, quizId);
    
    logActivity(
      user.id,
      'QUIZ_VIEWED',
      `${user.full_name} viewed quiz ID ${quizId} (${quiz.title})`,
      req.ip
    ).catch(console.error);
    
    res.status(200).json({success: true, message:"Data fetched successfully", data: quiz});
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Get quiz error:', error);
      res.status(500).json({ success: false, message: 'Failed to get quiz' });
    }
  }
};