import { Request, Response } from "express";
import { updateCourse } from "../../services/course/update.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { updateCourseSchema } from "../../validation/course.validation";
import { AppError } from "../../middleware/error.middleware";
import { ZodError } from "zod";
import { getCourseBySlug } from "../../services/course/listBySlug.service";
import { CreateCourseDto } from "types/course.types";

export const updateCourseController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const parsedBody = updateCourseSchema.parse(req.body);
    const updatedCourse = await updateCourse(slug, parsedBody as Partial<CreateCourseDto>);

    const course = await getCourseBySlug(updatedCourse.slug);
    successResponse(res, course);
  } catch (err) {
    console.error(err);
   
    if (err instanceof AppError) {
       errorResponse(res, err.message, err.statusCode,err.errors);
    }
    errorResponse(res, "Internal server error");
  }
};
