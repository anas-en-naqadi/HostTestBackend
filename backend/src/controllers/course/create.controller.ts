import { Request, Response } from "express";
import { createCourse } from "../../services/course/create.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { createCourseSchema } from "../../validation/course.validation";
import { getCourseBySlug } from "../../services/course/listBySlug.service";
import { saveThumbnail } from "../../utils/file.utils";

// Define a custom Request type that includes the multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Controller for creating a course
export const createCourseController = async (req: MulterRequest, res: Response) => {
  try {
    console.log('Received course creation request with body:', JSON.stringify(req.body, null, 2));
    
    // Handle file uploads if present with secure file handling
    const thumbnailFile = req.file;
    console.log('Thumbnail file:', thumbnailFile ? thumbnailFile.originalname : 'None');
    
    // Parse body data with proper validation
    let bodyData = req.body;
    
    // Parse JSON strings from FormData
    if (typeof bodyData.what_you_will_learn === 'string') {
      try {
        bodyData.what_you_will_learn = JSON.parse(bodyData.what_you_will_learn);
      } catch (e) {
        console.error('Error parsing what_you_will_learn:', e);
      }
    }
    
    if (typeof bodyData.course_requirements === 'string') {
      try {
        bodyData.course_requirements = JSON.parse(bodyData.course_requirements);
      } catch (e) {
        console.error('Error parsing course_requirements:', e);
      }
    }
    
    if (typeof bodyData.modules === 'string') {
      try {
        bodyData.modules = JSON.parse(bodyData.modules);
      } catch (e) {
        console.error('Error parsing modules:', e);
      }
    }
    
    // Convert string boolean to actual boolean
    if (bodyData.is_published === 'true') {
      bodyData.is_published = true;
    } else if (bodyData.is_published === 'false') {
      bodyData.is_published = false;
    }
    
    // Convert numeric strings to numbers
    if (bodyData.instructor_id) {
      bodyData.instructor_id = Number(bodyData.instructor_id);
    }
    
    if (bodyData.category_id) {
      bodyData.category_id = Number(bodyData.category_id);
    }
    
    // Handle thumbnail file if present using secure file handling utilities
    if (thumbnailFile) {
      try {
        // Save the thumbnail using our secure file handling utility
        const thumbnailUrl = saveThumbnail(thumbnailFile);
        bodyData.thumbnail_url = thumbnailUrl;
        console.log('Saved thumbnail to:', thumbnailUrl);
      } catch (error) {
        console.error('Error saving thumbnail:', error);
        throw new AppError(400, 'Error processing thumbnail file');
      }
    }

    console.log('Processed body data:', JSON.stringify(bodyData, null, 2));
    
    // Validate the processed body data
    const parsedBody = createCourseSchema.parse(bodyData);
    
    const userId = req.user?.id;
    if(!userId){
      throw new AppError(401,"User Unauthenticated");
    }

    // Create the course using the validated data
    const newCourse = await createCourse(parsedBody as CreateCourseDto, userId);
    // Respond with the created course
    successResponse(res, newCourse);
  } catch (err) {
    console.log(err);
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } 
    else {
      errorResponse(res, "Internal server error");
    }
  }
};
