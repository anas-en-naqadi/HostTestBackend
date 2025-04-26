// src/controllers/notes/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateNote } from '../../services/notes/update.service';
import { AppError } from '../../middleware/error.middleware';

export const updateNoteController = async (
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
    const id = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid note ID',
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

    const note = await updateNote(userId, id, content);
    res.status(200).json({ 
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to update note',
        data: null
      });
    }
  }
};