// src/controllers/activityLog/list.controller.ts

import { Request, Response } from 'express';
import { listActivityLogs } from '../../services/activity_log/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse,ActivityLogResponse } from '../../types/activity_log.types';

export const listActivityLogsController = async (
  _req: Request,
  res: Response<ApiResponse<ActivityLogResponse[]>>
): Promise<void> => {
  try {
    const logs = await listActivityLogs();
    successResponse(res, logs, 'Activity logs fetched successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
