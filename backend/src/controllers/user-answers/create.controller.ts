// src/controllers/user-answers/create.controller.ts
import { Response } from 'express';
import { createUserAnswer } from '../../services/user-answers/create.service';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../types/quiz.types'; // Assuming this type includes `req.user`
import { logActivity } from '../../utils/activity_log.utils';

export const createUserAnswerController = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const { attemptId, questionId, optionId } = req.body;

    if (!attemptId || !questionId || isNaN(attemptId) || isNaN(questionId)) {
      throw new AppError(400, 'Valid attemptId and questionId are required');
    }

    const answer = await createUserAnswer(user.id, {
      attemptId: Number(attemptId),
      questionId: Number(questionId),
      optionId
    });

    // Log activity
    logActivity(
      user.id,
      'USER_ANSWER_SUBMITTED',
      `${user.full_name} submitted answer for question ID ${questionId} in quiz attempt ID ${attemptId}`,
      req.ip
    ).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'User answer created successfully',
      data: answer
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Create user answer error:', error);
      res.status(500).json({ success: false, message: 'Failed to create user answer' });
    }
  }
};
