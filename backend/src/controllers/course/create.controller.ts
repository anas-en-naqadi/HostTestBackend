import { Request, Response } from "express";
import { createCourse } from "../../services/course/create.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { createCourseSchema } from "../../validation/course.validation";
import { getCourseBySlug } from "../../services/course/listBySlug.service";

// Controller for creating a course
export const createCourseController = async (req: Request, res: Response) => {
  try {
    // Validate the incoming request body using Zod schema
    const parsedBody = createCourseSchema.parse(req.body);
    const userId = req.user?.id;
    if(!userId){
      throw new AppError(401,"User Unauthenticated");
    }

    // Create the course using the validated data
    const newCourse = await createCourse(parsedBody as CreateCourseDto);
    const course = await getCourseBySlug(newCourse.slug,userId);
    // Respond with the created course
    successResponse(res, course);
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
