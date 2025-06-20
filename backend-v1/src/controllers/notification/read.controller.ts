import { Request, Response } from 'express';
import { markAllNotificationsAsRead } from '../../services/notification/read.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../types/notification.types';
import { logActivity } from '../../utils/activity_log.utils';

export const markAllAsReadController = async (
  req: Request,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await markAllNotificationsAsRead(userId);
    
    // Log activity
    logActivity(
      userId,
      'NOTIFICATIONS_MARKED_READ',
      `${req.user!.full_name} marked ${count} notifications as read`,
      req.ip
    ).catch(console.error);
    
    successResponse(
      res,
      null,
      `Successfully marked ${count} notifications as read`
    );
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};