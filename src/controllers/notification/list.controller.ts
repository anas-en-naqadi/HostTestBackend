import { Request, Response } from 'express';
import { listNotifications } from '../../services/notification/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../types/notification.types';

export const listNotificationsController = async (
  req: Request,
  res: Response<ApiResponse<{
    notifications: import('../../types/notification.types').NotificationResponse[];
    unreadCount: number;
  }>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const payload = await listNotifications(userId);
    successResponse(res, payload, 'Notifications fetched successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
