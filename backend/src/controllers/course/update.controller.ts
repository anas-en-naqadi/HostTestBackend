// In controllers/course/index.ts or controllers/course/update-handler.ts

import { Request, Response, NextFunction } from 'express';
import { updateCourse } from '../../services/course/update.service';
import { AppError } from '../../middleware/error.middleware';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { saveThumbnail, deleteThumbnail } from '../../utils/file.utils';
import prisma from '../../config/prisma';

// Define a custom Request type that includes the multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// This is the Express route handler
export const updateCourseController = async (req: MulterRequest, res: Response, next: NextFunction) => {
  try {
    const courseSlug = req.params.slug;
    const courseData = req.body;
    
    // Handle thumbnail file if present using secure file handling utilities
    if (req.file) {
      try {
        // Get the existing course to find the old thumbnail
        // We only need the course data, not the full course with modules, so we'll use a direct Prisma query
        const existingCourse = await prisma.courses.findUnique({
          where: { slug: courseSlug },
          select: { thumbnail_url: true }
        });
        
        if (existingCourse && existingCourse.thumbnail_url) {
          // Delete the old thumbnail file
          const deleted = deleteThumbnail(existingCourse.thumbnail_url);
          if (deleted) {
            console.log(`Deleted old thumbnail for course ${courseSlug}`);
          }
        }
        
        // Save the new thumbnail using our secure file handling utility
        const thumbnailUrl = saveThumbnail(req.file);
        courseData.thumbnail_url = thumbnailUrl;
        console.log('Updated thumbnail to:', thumbnailUrl);
      } catch (error) {
        console.error('Error processing thumbnail:', error);
         errorResponse(res, 'Error processing thumbnail file', 400);
      }
    }
    
    const updatedCourse = await updateCourse(courseSlug, courseData);
    
    successResponse(res, updatedCourse);
  } catch (error) {
    console.log(error)
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode, error.errors);
    }
    next(error);
  }
};