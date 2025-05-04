import { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/error.middleware";
import { getUserDashboardStats } from "../../services/dashboard";
import { errorResponse, successResponse } from "../../utils/api.utils";

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
    successResponse(res, stats);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
}
