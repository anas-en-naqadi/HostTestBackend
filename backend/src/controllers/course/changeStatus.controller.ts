// src/controllers/course/changeStatus.controller.ts
import { Request, Response } from 'express';
import { changeCourseStatusService } from '../../services/course/changeStatus.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { logActivity } from '../../utils/activity_log.utils';
import { AppError } from '../../middleware/error.middleware';

export const changeCourseStatusController = async (req: Request, res: Response) => {
  try {
    const { course_id } = req.params;
    const { is_published } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }
    if (typeof is_published !== 'boolean') {
      throw new AppError(400, 'Invalid is_published value.');
    }

    await changeCourseStatusService(parseInt(course_id), is_published, userId, req.user?.role!);

    logActivity(
      userId,
      'COURSE_STATUS_CHANGED',
      `Course status changed for course ID: ${course_id} to ${is_published ? 'published' : 'unpublished'}`,
      req.ip
      ).catch(console.error);

    successResponse(res, { message: 'Course status updated successfully.' });
    } catch (err: any) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, 'An error occurred while updating the course status.');
    }
  }
};
