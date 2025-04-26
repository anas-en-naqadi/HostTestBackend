// src/controllers/notes/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getNotes } from '../../services/notes/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listNotesController = async (
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
    const notes = await getNotes(userId);
    res.status(200).json({ 
      success: true,
      message: 'Notes retrieved successfully',
      data: notes
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to retrieve notes',
        data: null
      });
    }
  }
};