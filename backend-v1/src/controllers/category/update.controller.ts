import e, { Request, Response } from 'express';
import { updateCategory } from '../../services/category/update.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';
import { logActivity } from '../../utils/activity_log.utils';

export const updateCategoryController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const slug = req.params.slug;
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "User not authenticated");
    }
    const { name } = req.body;
    const updated = await updateCategory(slug, { name }, userId);

    const user = req.user;

    logActivity(
      userId,
      'CATEGORY_UPDATED',
      `${user!.full_name} updated category "${updated.name}" (ID: ${updated.id})`,
      req.ip
    ).catch(console.error);

    successResponse(res, updated, 'Category updated successfully');
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
