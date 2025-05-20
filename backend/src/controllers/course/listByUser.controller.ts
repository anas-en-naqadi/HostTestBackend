import { Request, Response } from 'express';
import { listCoursesByUserId } from '../../services/course';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { ApiResponse } from '../../types/category.types';
import { logActivity } from '../../utils/activity_log.utils';
import { AppError } from '../../middleware/error.middleware';

export const listCoursesByUserController = async (
  req: Request,
  res: Response<ApiResponse<any>>
): Promise<void> => {
  try {
    // Extract user ID from params
    const userId = req.user!.id;
    
  
    if (!userId) {
      throw new AppError(401,'User is unaunthenticated');
    }

    
    // Call the service with user ID and search query
    const result = await listCoursesByUserId(userId, req.user?.role!);
    
    // Log the activity
    logActivity(
      req.user!.id,
      'USER_COURSES_LIST',
      `${req.user!.full_name} Listed all courses for user ID ${userId}`,
      req.ip
    ).catch(console.error);

    // Return the courses and pagination info
    successResponse(res, result);
  } catch (err) {
    console.error("Error in listCoursesByUserController:", err);
    errorResponse(res, 'Internal server error');
  }
};
