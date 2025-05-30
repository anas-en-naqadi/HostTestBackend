// src/controllers/dashboard/dashboardGraphs.controller.ts
import { Request, Response } from 'express';
import { getPerformanceData } from '../../services/admin_dashboard/graphs.service';
import { successResponse, errorResponse } from '../../utils/api.utils';

export const getPerformanceDataController = async (req: Request, res: Response) => {
  try {
    const performanceData = await getPerformanceData();
    return successResponse(res, performanceData, 'Performance data retrieved successfully');
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return errorResponse(res, 'Failed to retrieve performance data', 500);
  }
};