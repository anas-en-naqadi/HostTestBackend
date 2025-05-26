import { Response, NextFunction, Request } from "express";
import { getAnnouncements } from "../../services/announcements/list.service";
import { AppError } from "../../middleware/error.middleware";
import { logActivity } from "../../utils/activity_log.utils";

// controllers/announcements/list.controller.ts
export const listAnnouncementsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, "User not authenticated");
    }

    const userId = user.id;
    const isAdmin = user.role_id === 1;
    const announcements = await getAnnouncements(userId, isAdmin);

    logActivity(
      userId,
      'ANNOUNCEMENTS_LISTED',
      `${req.user!.full_name} listed announcements (${announcements.length} items)`,
      req.ip
    ).catch(console.error);

    res.status(200).json({
      success: true,
      message: "Announcements retrieved successfully",
      data: announcements,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error listing announcements:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to retrieve announcements" });
    }
  }
};
