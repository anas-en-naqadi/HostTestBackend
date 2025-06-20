import { Request, Response } from 'express';
import { removeRole } from '../../services/role/remove.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const removeRoleController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid role ID');
    
    // Get role details before deletion for logging
    const roleToDelete = await prisma.roles.findUnique({
      where: { id },
      select: { name: true }
    });
    
    await removeRole(id);
    
    // Log activity if admin user is deleting this role
    if (req.user && roleToDelete) {
      logActivity(
        req.user.id,
        'ROLE_DELETED',
        `${req.user.full_name} deleted role: ${roleToDelete.name} (ID: ${id})`,
        req.ip
      ).catch(console.error);
    }
    
    successResponse(res, null, 'Role deleted successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
