import { Request, Response } from 'express';
import { createRole } from '../../services/role/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, RoleResponse } from '../../types/role.types';
import { logActivity } from '../../utils/activity_log.utils';

export const createRoleController = async (
  req: Request,
  res: Response<ApiResponse<RoleResponse>>
): Promise<void> => {
  try {
    const newRole = await createRole(req.body);
    
    // Log activity if admin user is creating this role
    if (req.user) {
      logActivity(
        req.user.id,
        'ROLE_CREATED',
        `${req.user.full_name} created role: ${newRole.name}`,
        req.ip
      ).catch(console.error);
    }
    
    successResponse(res, newRole, 'Role created successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
