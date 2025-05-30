// src/controllers/dashboard/dashboardGraphs.controller.ts
import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { getInstructorPerformanceData } from '../../services/instructor_dashboard';
import { AppError } from '../../middleware/error.middleware';


export const getInstructorPerformanceDataController = async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated user
        const user = req.user;
        if (!user) {
          throw new AppError(401, "User not authenticated");
        }
    const instructorId = Number(user.id);
    // optional weeks window: defaults to 5 (or whatever your service default is)
    const weeks = req.query.weeks ? parseInt(req.query.weeks as string, 10) : undefined;
    const performanceData = await getInstructorPerformanceData(instructorId, weeks);
     successResponse(res, performanceData, 'Performance data retrieved successfully');
  } catch (error) {
    console.error('Error fetching performance data for instructor:', error);
     errorResponse(res, 'Failed to retrieve performance data', 500);
  }
};
