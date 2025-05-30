// src/controllers/dashboard/dashboardData.controller.ts
import { Request, Response } from "express";
import { getDashboardStats } from "../../services/admin_dashboard/stats.service";
import { getPerformanceData } from "../../services/admin_dashboard/graphs.service";
import { getPopularCourses } from "../../services/admin_dashboard/courseSuggestions.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { DashboardResponse } from "../../types/dashboard.types";
import { AppError } from "../../middleware/error.middleware";

export const getDashboardDataController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "User not authenticated");
    }
    // If not in cache, fetch all required data
    const [stats, performanceData, popularCourses] = await Promise.all([
      getDashboardStats(userId),
      getPerformanceData(),
      getPopularCourses(4),
    ]);

    const dashboardData: DashboardResponse = {
      stats,
      performanceData,
      popularCourses,
    };

    return successResponse(
      res,
      dashboardData,
      "Dashboard data retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return errorResponse(res, "Failed to retrieve dashboard data", 500);
  }
};
