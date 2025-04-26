import e, { Request, Response } from 'express';
import { updateCategory } from '../../services/category/update.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';

export const updateCategoryController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const slug = req.params.slug;
  
    const { name } = req.body;
    const updated = await updateCategory(slug, { name });
    successResponse(res, updated, 'Category updated successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
