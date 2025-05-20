// src/controllers/activityLog/list.controller.ts

import { Request, Response } from 'express';
import { listActivityLogs } from '../../services/activity_log/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, PaginatedResponse, ActivityLogResponse } from '../../types/activity_log.types';

export const listActivityLogsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract only sorting parameters
    const sortBy = (req.query.sortBy as 'created_at' | 'activity_type' | 'actor_full_name') || 'created_at';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
    
    const logs = await listActivityLogs(sortBy, sortOrder);
    successResponse(res, logs, 'Activity logs fetched successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};