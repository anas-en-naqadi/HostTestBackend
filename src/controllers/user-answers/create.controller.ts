// src/controllers/user-answers/create.controller.ts
import { Response } from 'express';
import { createUserAnswer } from '../../services/user-answers/create.service';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../types/quiz.types'; // Assuming this type includes `req.user`

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
