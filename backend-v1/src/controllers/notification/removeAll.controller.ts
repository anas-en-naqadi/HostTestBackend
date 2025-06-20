import { Request, Response } from 'express';
import { removeAllReadNotifications } from '../../services/notification/removeAll.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../types/notification.types';
import { logActivity } from '../../utils/activity_log.utils';

export const removeAllReadController = async (
  req: Request,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await removeAllReadNotifications(userId);
    
    // Log activity
    logActivity(
      userId,
      'NOTIFICATIONS_CLEARED',
      `${req.user!.full_name} cleared ${count} read notifications`,
      req.ip
    ).catch(console.error);
    
    successResponse(
      res, 
      null,
      `Successfully removed ${count} read notifications`
    );
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};