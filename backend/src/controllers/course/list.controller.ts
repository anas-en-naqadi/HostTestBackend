import { Request, Response } from 'express';
import { listAllCourses } from '../../services/course';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { ApiResponse } from '../../types/category.types';
import { CourseResponse } from 'types/course.types';

export const listCoursesController = async (
  _req: Request,
  res: Response<ApiResponse<CourseResponse[]>>
): Promise<void> => {
  try {
    const courses = await listAllCourses();
    
    successResponse(res, courses);
  } catch (err) {
    errorResponse(res, 'Internal server error');
  }
};
