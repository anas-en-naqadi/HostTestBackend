import { Request, Response } from "express";
import { removeCourseBySlug } from "../../services/course/remove.service";
import { errorResponse, successResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";
import { logActivity } from "../../utils/activity_log.utils";
import prisma from "../../config/prisma";

// Controller for removing a course
export const removeCourseBySlugController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const userId = req.user?.id;
    
    if (!userId) {
      throw new AppError(401, "User not authenticated");
    }
    
    // Get course details before deletion for activity log
    const course = await prisma.courses.findUnique({
      where: { slug },
      select: { title: true }
    });
    
    if (!course) {
      throw new AppError(404, "Course not found");
    }
    
    // Call service to remove course
    await removeCourseBySlug(slug);
    
    // Log the activity
    logActivity(
      userId,
      'COURSE_DELETED',
      `${req.user?.full_name} deleted course: ${course.title} (${slug})`,
      req.ip
    ).catch(console.error);
    
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