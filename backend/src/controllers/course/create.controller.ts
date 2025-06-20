import { Request, Response } from "express";
import { ZodError } from "zod";
import { createCourse } from "../../services/course/create.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { createCourseSchema } from "../../validation/course.validation";
import { logActivity } from "../../utils/activity_log.utils";
import { logger } from "../../middleware/logging.middleware";

/**
 * Controller for creating a course.
 * This controller expects a clean JSON body with pre-uploaded media URLs.
 * File uploads are handled separately by the dedicated upload controller.
 */
export const createCourseController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "User Unauthenticated");
    }

    // The request body should be clean JSON, no more FormData parsing is needed.
    const courseData = req.body;

    // Validate the incoming data using Zod schema.
    // The schema should now enforce that URL fields are valid URLs.
    const parsedBody = createCourseSchema.parse(courseData);

    // The service layer expects a clean DTO.
    const newCourse = await createCourse(parsedBody as CreateCourseDto, userId);

    // Log the successful creation activity.
    logActivity(
      userId,
      'COURSE_CREATED',
      `${req.user?.full_name} created a new course: ${newCourse.title}`,
      req.ip
    ).catch(err => logger.error('Failed to log activity for course creation:', err));

    // Respond with the newly created course data.
    successResponse(res, newCourse, "Course created successfully", 201);

  } catch (err) {
    // Centralized error handling.
    logger.error('Course creation failed:', err);
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else if (err instanceof ZodError) {
      // Handle Zod validation errors specifically for better client feedback
      errorResponse(res, 'Invalid data provided', 400, err.errors);
    } else {
      errorResponse(res, "An internal server error occurred during course creation.");
    }
  }
};
