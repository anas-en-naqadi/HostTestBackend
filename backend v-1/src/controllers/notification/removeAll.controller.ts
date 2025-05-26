import { Request, Response } from 'express';
import { removeAllReadNotifications } from '../../services/notification/removeAll.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../types/notification.types';

export const removeAllReadController = async (
  req: Request,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const userId = req.user!.id;
   await removeAllReadNotifications(userId);
    
    successResponse(
      res, 
      null,
      `Successfully removed read notification`
    );
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};