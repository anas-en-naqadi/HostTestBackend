// src/controllers/dashboard/stats.controller.ts
import { Request, Response } from 'express';
import { getDashboardStats } from '../../services/admin_dashboard/stats.service';
import { errorResponse, successResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';

export const getDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "User not authenticated");
    }
    const stats = await getDashboardStats(userId);
    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return errorResponse(res, 'Failed to retrieve dashboard stats', 500);
  }
};
