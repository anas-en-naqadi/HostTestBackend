// src/controllers/role/assign_permission.controller.ts

import { Request, Response } from 'express';
import { assignPermission } from '../../services/role/assign_permission.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, AssignPermissionDto } from '../../types/role.types';

export const assignPermissionController = async (
  req: Request<{}, {}, AssignPermissionDto>,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const role_permissions = req.body;

  if(!Array.isArray(role_permissions)){
    throw new AppError(400, 'role_permissions must be an array');
   }
   if(role_permissions.length === 0){
    throw new AppError(400, 'role_permissions array cannot be empty');
   }

    await assignPermission(role_permissions);

    successResponse(res, null, 'Permission assigned to role successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
