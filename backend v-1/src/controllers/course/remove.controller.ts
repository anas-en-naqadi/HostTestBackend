import { Request, Response } from "express";
import { removeCourseBySlug } from "../../services/course/remove.service";
import { errorResponse, successResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";

// Controller for removing a course
export const removeCourseBySlugController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    

    // Call service to remove course
    await removeCourseBySlug(slug);
    
    // Send success response
     successResponse(res, null, 'Course deleted successfully');
  } catch (err) {
    console.error('Error in removeCourseByIdController:', err);
    
    // Handle AppError instances
    if (err instanceof AppError) {
       errorResponse(res, err.message, err.statusCode,err.errors);
    }else
    
    // Handle other errors
     errorResponse(res, 'Internal server error', 500);
  }
};