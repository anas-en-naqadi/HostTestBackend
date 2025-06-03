// src/controllers/dashboard/stats.controller.ts
import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { getInstructorStats } from '../../services/instructor_dashboard';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';


export const getInstructorDashboardStatsController = async (req: Request, res: Response) => {
  try {
     const user = req.user;
            if (!user) {
              throw new AppError(401, "User not authenticated");
            }
    const instructorId = Number(user.id);
    const stats = await getInstructorStats(instructorId);
    
    // Log activity
    logActivity(
      instructorId,
      'INSTRUCTOR_DASHBOARD_COMPLETE_VIEW',
      `${user.full_name} viewed their instructor dashboard`,
      req.ip
    ).catch(console.error);
    
    successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching dashboard stats for instructor:', error);
     errorResponse(res, 'Failed to retrieve dashboard stats', 500);
  }
};
