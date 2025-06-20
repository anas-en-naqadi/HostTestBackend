// src/controllers/dashboard/courseSuggestions.controller.ts
import { Request, Response } from 'express';
import { getPopularCourses } from '../../services/admin_dashboard/courseSuggestions.service';
import { successResponse, errorResponse } from '../../utils/api.utils';

export const getPopularCoursesController = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    const popularCourses = await getPopularCourses(limit);
    return successResponse(res, popularCourses, 'Popular courses retrieved successfully');
  } catch (error) {
    console.error('Error fetching popular courses:', error);
    return errorResponse(res, 'Failed to retrieve popular courses', 500);
  }
};