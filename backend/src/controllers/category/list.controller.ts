import { Request, Response } from 'express';
import { listCategories } from '../../services/category/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { ApiResponse, CategoryResponse } from '../../types/category.types';

export const listCategoriesController = async (
  _req: Request,
  res: Response<ApiResponse<CategoryResponse[]>>
): Promise<void> => {
  try {
    const cats = await listCategories();
    successResponse(res, cats);
  } catch (err) {
    errorResponse(res, 'Internal server error');
  }
};
