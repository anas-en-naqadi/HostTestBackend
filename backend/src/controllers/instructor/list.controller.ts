import { Request, Response } from 'express';
import { listInstructors } from '../../services/instructor/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';

import { ApiResponse, InstructorResponse } from '../../types/instructor.types';

export const listInstructorsController = async (
  _req: Request,
  res: Response<ApiResponse<InstructorResponse[]>>
): Promise<void> => {
  try {
    const data = await listInstructors();
    successResponse(res, data);
  } catch (err) {
    errorResponse(res, 'Internal server error');
  }
};