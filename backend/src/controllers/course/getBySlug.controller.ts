import { Request, Response } from "express";
import {getCourseBySlug} from '../../services/course/listBySlug.service';
import { errorResponse, successResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";

export const getCourseBySlugController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;


    const course = await getCourseBySlug(slug);

    if (!course) {
      throw new AppError(404, "Course not found");
    }

    successResponse(res, course);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, "Internal server error", 500);
    }
  }
};
