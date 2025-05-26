import { Request, Response } from 'express';
import { createRole } from '../../services/role/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, RoleResponse } from '../../types/role.types';

export const createRoleController = async (
  req: Request,
  res: Response<ApiResponse<RoleResponse>>
): Promise<void> => {
  try {
    const newRole = await createRole(req.body);
    successResponse(res, newRole, 'Role created successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
