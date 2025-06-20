import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../utils/api.utils';
import { changeStatus } from '../../services/user';
import { logActivity } from '../../utils/activity_log.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const changeStatusController = async (
  req: Request, 
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { status, user_id } = req.body;
   

    if (isNaN(user_id)) {
      throw new AppError(400, 'Invalid user ID');
    }
     if (!status) {
      throw new AppError(400, 'Status value required');
    }

    // Get user details for logging
    const targetUser = await prisma.users.findUnique({
      where: { id: user_id },
      select: { full_name: true, email: true }
    });
    
    await changeStatus(user_id, status);
    
    // Log activity if admin user is changing status
    if (req.user && targetUser) {
      logActivity(
        req.user.id,
        'USER_STATUS_CHANGED',
        `${req.user.full_name} changed status for user: ${targetUser.full_name} (${targetUser.email}) to ${status}`,
        req.ip
      ).catch(console.error);
    }
   
     successResponse(res, null, 'Account status updated successfully !!');
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode, error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 