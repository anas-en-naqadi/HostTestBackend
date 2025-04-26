import { Request, Response } from 'express';
import { getRolesList } from '../../services/role/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, RoleResponse } from '../../types/role.types';

export const getRolesListController = async (
  req: Request,
  res: Response<ApiResponse<RoleResponse[]>>
): Promise<void> => {
  try {
    const roles = await getRolesList();
    successResponse(res, roles, 'Roles fetched successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
