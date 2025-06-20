// src/controllers/role/assign_permission.controller.ts

import { Request, Response } from 'express';
import { assignPermission } from '../../services/role/assign_permission.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, AssignPermissionDto } from '../../types/role.types';
import { logActivity } from '../../utils/activity_log.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Log activity if admin user is assigning permissions
    if (req.user) {
      // Get role details for better logging
      const roleIds = [...new Set(role_permissions.map(rp => rp.role_id))];
      const roles = await prisma.roles.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true }
      });
      
      // Get permission details for better logging
      const permissionIds = [...new Set(role_permissions.map(rp => rp.permission_id))];
      
      const roleNames = roles.map(r => r.name).join(', ');
      const permissionCount = permissionIds.length;
      
      logActivity(
        req.user.id,
        'ROLE_PERMISSIONS_ASSIGNED',
        `${req.user.full_name} assigned ${permissionCount} permissions to roles: ${roleNames}`,
        req.ip
      ).catch(console.error);
    }

    successResponse(res, null, 'Permission assigned to role successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
