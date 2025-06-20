import { Request, Response } from 'express';
import { getCategoryBySlug } from '../../services/category/getBySlug.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse, CategoryResponse } from '../../types/category.types';
import { logActivity } from '../../utils/activity_log.utils';

export const getCategoryBySlugController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const slug = req.params.slug;

    const cat = await getCategoryBySlug(slug);
    
    // Log activity if user is authenticated
    if (req.user) {
      logActivity(
        req.user.id,
        'CATEGORY_VIEWED',
        `${req.user.full_name} viewed category "${cat.name}" (slug: ${slug})`,
        req.ip
      ).catch(console.error);
    }
    
    successResponse(res, cat);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, 'Internal server error');
    }
  }
};
