import { Request, Response } from 'express';
import { updateInstructor } from '../../services/instructor/update.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, InstructorResponse } from '../../types/instructor.types';

export const updateInstructorController = async (
  req: Request,
  res: Response<ApiResponse<InstructorResponse>>
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid instructor ID');
    const updated = await updateInstructor(id, req.body);
    successResponse(res, updated, 'Instructor updated');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};