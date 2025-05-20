// src/controllers/dashboard/courseSuggestions.controller.ts
import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { getInstructorPopularCourses } from '../../services/instructor_dashboard';
import { AppError } from '../../middleware/error.middleware';


export const getInstructorPopularCoursesController = async (req: Request, res: Response) => {
  try {
       const user = req.user;
            if (!user) {
              throw new AppError(401, "User not authenticated");
            }
    const instructorId = Number(user.id);
    const popularCourses = await getInstructorPopularCourses(instructorId);
     successResponse(res, popularCourses, 'Popular courses retrieved successfully');
  } catch (error) {
    console.error('Error fetching popular courses for instructor:', error);
     errorResponse(res, 'Failed to retrieve popular courses', 500);
  }
};
