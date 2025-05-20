import { Request, Response } from "express";
import { removeCategory } from "../../services/category/remove.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";
import { ApiResponse, CategoryResponse } from "../../types/category.types";
import { logActivity } from "../../utils/activity_log.utils";

export const removeCategoryController = async (
  req: Request,
  res: Response<ApiResponse<CategoryResponse>>
): Promise<void> => {
  try {
    const slug = req.params.slug;

    const deleted = await removeCategory(slug);

    const user = req.user;

    logActivity(
      user!.id, 
      "CATEGORY_DELETED",
      `${user!.full_name} deleted category slug ${slug})`,
      req.ip
    ).catch(console.error);

    successResponse(res, null as any, "Category deleted successfully");
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Internal server error");
    }
  }
};
