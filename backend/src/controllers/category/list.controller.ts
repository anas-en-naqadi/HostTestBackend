// src/controllers/category/list.controller.ts
import { Request, Response } from 'express';
import { listCategories } from '../../services/category/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { z } from 'zod';
import { logActivity } from '../../utils/activity_log.utils';

// Query parameter validation schema
const querySchema = z.object({
  sortBy: z.enum(['name', 'courseCount']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
}).strict();

export const listCategoriesController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate and parse query parameters
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      throw parsed.error;
    }
    const { sortBy, sortOrder } = parsed.data;
    
    const user = req.user;
    
    const result = await listCategories({
      sortBy,
      sortOrder,
      userId: user!.id,
      roleId: user!.role_id
    });


    logActivity(
      user!.id,
      'CATEGORY_LISTED',
      `${user!.full_name} listed categories (${result.data.length} items)`,
      req.ip
    ).catch(console.error);
    
    successResponse(res, result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      errorResponse(res, 'Invalid query parameters', 400, err.errors);
    } else {
      errorResponse(res, 'Internal server error', 500);
    }
  }
};