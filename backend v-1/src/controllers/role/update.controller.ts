import { Request, Response } from 'express';
import { updateRole } from '../../services/role/update.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, RoleResponse } from '../../types/role.types';

export const updateRoleController = async (
  req: Request,
  res: Response<ApiResponse<RoleResponse>>
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid role ID');
    const updatedRole = await updateRole(id, req.body);
    successResponse(res, updatedRole, 'Role updated successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
