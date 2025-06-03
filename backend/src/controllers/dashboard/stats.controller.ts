import { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/error.middleware";
import { getUserDashboardStats } from "../../services/dashboard";
import { errorResponse, successResponse } from "../../utils/api.utils";
import { logActivity } from "../../utils/activity_log.utils";

export async function userDashboardStatsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "User not authenticated");
    }

    const stats = await getUserDashboardStats(userId);
    
    // Log activity
    logActivity(
      userId,
      'INTERN_DASHBOARD_COMPLETE_VIEW',
      `${req.user!.full_name} viewed their intern dashboard`,
      req.ip
    ).catch(console.error);
    
    successResponse(res, stats);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
}
