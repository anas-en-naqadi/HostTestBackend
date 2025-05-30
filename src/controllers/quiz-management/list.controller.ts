// src/controllers/quiz-management/list.controller.ts
import { Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { getQuizzes } from '../../services/quiz-management/list.service';
import { AuthRequest } from '../../types/quiz.types';
import { logActivity } from '../../utils/activity_log.utils';

export const listQuizzesController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const quizzes = await getQuizzes(user.id);

    logActivity(
      user.id,
      'QUIZ_LISTED',
      `${user.full_name} viewed quizzes (${quizzes.length} items)`,
      req.ip
    ).catch(console.error);
    
    res.status(200).json({ 
      success: true, 
      message: "Data fetched successfully", 
      data: quizzes
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('List quizzes error:', error);
      res.status(500).json({ success: false, message: 'Failed to list quizzes' });
    }
  }
};