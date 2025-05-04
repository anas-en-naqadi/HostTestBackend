// src/controllers/notes/remove.controller.ts
import { Response, NextFunction, Request } from "express";
import { deleteNote } from "../../services/notes/remove.service";
import { AppError } from "../../middleware/error.middleware";
import { errorResponse, successResponse } from "../../utils/api.utils";

export const removeNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const user = req.user;
    if (!user) {
      throw new AppError(401, "User not authenticated");
    }

    const userId = user.id;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      throw new AppError(400, "incorrect Note id type");
    }

    await deleteNote(userId, id);

    successResponse(res,null);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Failed to delete note");
    }
  }
};
