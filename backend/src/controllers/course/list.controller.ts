import { Request, Response } from 'express';
import { listAllCourses } from '../../services/course';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { ApiResponse } from '../../types/category.types';
import { CourseResponse } from '../../types/course.types';

export const listCoursesController = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    
    // Extract filter parameters
    const filters = {
      query: req.query.query as string || null,
      durations: req.query.durations 
        ? Array.isArray(req.query.durations) 
          ? req.query.durations as string[]
          : [req.query.durations as string]
        : null,
      topics: req.query.topics
        ? Array.isArray(req.query.topics)
          ? req.query.topics as string[]
          : [req.query.topics as string]
        : null,
      levels: req.query.levels
        ? Array.isArray(req.query.levels)
          ? req.query.levels as string[]
          : [req.query.levels as string]
        : null
    };
    
    // Extract userId from authenticated user
    const userId = req.user?.id; // Adjust based on your auth middleware
    
    console.log("Applying filters:", filters, "User ID:", userId);
    
    // Call the service with pagination, filters, and userId
    const { courses, pagination } = await listAllCourses(page, limit, filters, userId);
    
    // Return the courses array and pagination info together
    successResponse(res, {
      courses,
      pagination
    });
  } catch (err) {
    console.error("Error in listCoursesController:", err);
    errorResponse(res, 'Internal server error');
  }
};