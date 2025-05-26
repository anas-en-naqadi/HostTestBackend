import { Request, Response } from 'express';
import { getCategoryBySlug } from '../../services/category/getBySlug.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';

export const getCategoryBySlugController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const slug = req.params.slug;

    const cat = await getCategoryBySlug(slug);
    successResponse(res, cat);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
