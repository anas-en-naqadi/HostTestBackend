import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { updateCourse } from '../../services/course/update.service';
import { AppError } from '../../middleware/error.middleware';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { logActivity } from '../../utils/activity_log.utils';
import { logger } from '../../middleware/logging.middleware';
import { updateCourseSchema } from '../../validation/course.validation';

/**
 * Controller for updating a course.
 * This controller expects a clean JSON body with pre-uploaded media URLs.
 * File uploads are handled separately by the dedicated upload controller.
 * The associated service layer handles the logic of deleting old files if new URLs are provided.
 */
export const updateCourseController = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    // The request body is clean JSON, validated by Zod.
    // The schema allows partial updates, so only provided fields will be validated.
    const courseData = updateCourseSchema.parse(req.body);
    console.log("courseData", courseData)
    // The service layer handles the core logic of updating the course.
    const updatedCourse = await updateCourse(slug, courseData, userId);

    // Log the successful update activity.
    logActivity(
      userId,
      'COURSE_UPDATED',
      `${req.user?.full_name} updated course: ${updatedCourse.title}`,
      req.ip
    ).catch(err => logger.error('Failed to log activity for course update:', err));

    // Respond with the updated course data.
    successResponse(res, updatedCourse, 'Course updated successfully');

  } catch (err) {
    // Centralized error handling.
    logger.error(`Course update failed for slug [${req.params.slug}]:`, err);
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else if (err instanceof ZodError) {
      // Handle Zod validation errors for detailed client feedback.
      errorResponse(res, 'Invalid data provided for update', 400, err.errors);
    } else {
      errorResponse(res, 'An internal server error occurred during course update.');
    }
  }
};