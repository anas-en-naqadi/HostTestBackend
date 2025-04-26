import { Request, Response } from 'express';
import { createCategory } from '../../services/category/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';

export const createCategoryController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const { name } = req.body;
    const cat = await createCategory({ name });
    successResponse(res, cat, 'Category created successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
