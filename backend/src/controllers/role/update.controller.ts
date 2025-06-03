import { Request, Response } from 'express';
import { updateRole } from '../../services/role/update.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, RoleResponse } from '../../types/role.types';
import { logActivity } from '../../utils/activity_log.utils';

export const updateRoleController = async (
  req: Request,
  res: Response<ApiResponse<RoleResponse>>
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid role ID');
    const updatedRole = await updateRole(id, req.body);
    
    // Log activity if admin user is updating this role
    if (req.user) {
      logActivity(
        req.user.id,
        'ROLE_UPDATED',
        `${req.user.full_name} updated role: ${updatedRole.name} (ID: ${updatedRole.id})`,
        req.ip
      ).catch(console.error);
    }
    
    successResponse(res, updatedRole, 'Role updated successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
