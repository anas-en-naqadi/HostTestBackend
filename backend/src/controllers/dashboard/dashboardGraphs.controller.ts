import { Request, Response } from "express";
import * as dashboardService from "../../services/dashboard";
import { errorResponse, successResponse } from "../../utils/api.utils";


// Controller to get all dashboard chart data at once
export async function getDashboardChartDataController(
  req: Request,
  res: Response
) {
  // Early check for user authentication
  const user = (req as any).user;
  if (!user || !user.id) {
    errorResponse(res, "Unauthorized access", 401);
  }

  try {
    
    // Get data with Promise.all to handle parallel requests
    const data = dashboardService.getDashboardChartData(user.id);

    // Only send the response once we have successfully retrieved all data
    successResponse(
      res,
      data,
      "Dashboard chart data fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching dashboard chart data:", error);
    // Only send error response if we haven't already sent a response
    errorResponse(res, "Failed to fetch dashboard chart data", 500, error);
  }
}
