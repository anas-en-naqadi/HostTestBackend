import { Request, Response } from 'express';
import { getInstructorById } from '../../services/instructor/getById.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, InstructorResponse } from '../../types/instructor.types';

export const getInstructorByIdController = async (
  req: Request,
  res: Response<ApiResponse<InstructorResponse>>
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid instructor ID');
    const instructor = await getInstructorById(id);
    successResponse(res, instructor);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
