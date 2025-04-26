// src/controllers/user-answers/remove.controller.ts
import { Response, NextFunction, Request } from 'express';
import { deleteUserAnswer } from '../../services/user-answers/remove.service';
import { AppError } from '../../middleware/error.middleware';

export const removeUserAnswerController = async (
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
    const attemptId = parseInt(req.params.attemptId, 10);
    const questionId = parseInt(req.params.questionId, 10);

    if (isNaN(attemptId) || isNaN(questionId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid attemptId or questionId',
        data: null
      });
      return;
    }

    await deleteUserAnswer(userId, attemptId, questionId);
    res.status(200).json({ 
      success: true,
      message: 'User answer deleted successfully',
      data: null
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Remove user answer error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user answer' });
    }
  }
};