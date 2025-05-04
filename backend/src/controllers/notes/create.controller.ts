// src/controllers/notes/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createNote } from '../../services/notes/create.service';
import { AppError } from '../../middleware/error.middleware';

export const createNoteController = async (
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
    const { content,noted_at } = req.body;
    const lessonId = req.body.lesson_id;

    if (!lessonId || isNaN(lessonId)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid lesson ID is required',
        data: null
      });
      return;
    }

    if (!content) {
      res.status(400).json({ 
        success: false,
        message: 'Content is required',
        data: null
      });
      return;
    }

    const note = await createNote(userId, { 
      lessonId: Number(lessonId), 
      content,
      noted_at
    });

    res.status(201).json({ 
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Create note error:', error);
      res.status(500).json({ success: false, message: 'Failed to create note' });
    }
  }
};