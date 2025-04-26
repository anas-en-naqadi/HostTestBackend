// src/controllers/notes/getById.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getNoteById } from '../../services/notes/getById.service';
import { AppError } from '../../middleware/error.middleware';

export const getNoteByIdController = async (
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

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid note ID',
        data: null
      });
      return;
    }

    const note = await getNoteById(userId, id);
    res.status(200).json({ 
      success: true,
      message: 'Note retrieved successfully',
      data: note
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to retrieve note',
        data: null
      });
    }
  }
};