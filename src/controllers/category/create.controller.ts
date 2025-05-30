import { Request, Response } from 'express';
import { createCategory } from '../../services/category/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';
import { logActivity } from '../../utils/activity_log.utils';

export const createCategoryController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const { name } = req.body;
    const user = req.user;
    const cat = await createCategory({ name }, user!.id);

    
    logActivity(
      user!.id,
      'CATEGORY_CREATED',
      `${user!.full_name} created category "${cat.name}"`,
      req.ip
    ).catch(console.error);
    
    successResponse(res, cat, 'Category created successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
