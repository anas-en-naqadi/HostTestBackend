// src/controllers/notes/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateNote } from '../../services/notes/update.service';
import { AppError } from '../../middleware/error.middleware';
import { errorResponse, successResponse } from '../../utils/api.utils';

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
    if(!userId){
      throw new AppError(401,"user Unauthenticated");
    }
    const id = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (isNaN(id)) {
      throw new AppError(400, "incorrect Note id type");
    }

    if(!content){
      throw new AppError(400,"content doesn\'t exist in body");
    }


    const note = await updateNote(userId, id, content);

    successResponse(res,note);
  } catch (err) {
      if (err instanceof AppError) {
          errorResponse(res, err.message, err.statusCode, err.errors);
        } else {
          errorResponse(res, "Failed to delete note");
        }
  }
};