import { Response } from 'express';
import { AppError } from '../../middleware/error.middleware';
import { deleteQuiz, deleteQuestion, deleteOption } from '../../services/quiz-management/remove.service';
import { AuthRequest } from '../../types/quiz.types';
import { logActivity } from '../../utils/activity_log.utils';

export const deleteQuizController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const quizId = parseInt(req.params.id, 10);
    await deleteQuiz(user.id, quizId);
    
    logActivity(
      user.id,
      'QUIZ_DELETED',
      `${user.full_name} deleted quiz ID ${quizId}`,
      req.ip
    ).catch(console.error);
    
    res.status(200).json({success: true , message: 'Quiz deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Delete quiz error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete quiz' });
    }
  }
};

export const deleteQuestionController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const questionId = parseInt(req.params.questionId, 10);
    await deleteQuestion(user.id, questionId);
    res.status(200).json({success: true , message: 'Question deleted successfully' });
    // res.status(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Delete question error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete question' });
    }
  }
};

export const deleteOptionController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const optionId = parseInt(req.params.optionId, 10);
    await deleteOption(user.id, optionId);
    res.status(200).json({success: true , message: 'Option deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Delete option error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete option' });
    }
  }
};