import { Response, NextFunction, Request } from "express";
import { createEnrollment } from "../../services/enrollments/create.service";
import { AppError } from "../../middleware/error.middleware";
import { errorResponse, successResponse } from "../../utils/api.utils";
export const postEnrollmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const user = req.user;
    if (!user) {
      throw new AppError(401, "User not authenticated");
    }

    const userId = user.id;
    const { courseId } = req.body;

    if (!courseId || isNaN(courseId)) {
      res.status(400).json({
        success: false,
        message: "Valid course ID is required",
        data: null,
      });
      return;
    }

    const enrollment = await createEnrollment(userId, Number(courseId));

    successResponse(res, enrollment, "Enrollment created successfully");
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};
