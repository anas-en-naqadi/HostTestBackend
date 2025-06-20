import { Request, Response } from 'express';
import { createUser } from '../../services/user/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { CACHE_KEYS, clearCacheByPrefix } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
import { logActivity } from '../../utils/activity_log.utils';

/**
 * Controller to create a new user
 * @param req Express request
 * @param res Express response
 * @returns Response with created user
 */
export const createUserController = async (
  req: Request, 
  res: Response<ApiResponse<UserResponse>>
): Promise<void> => {
  try {
    const newUser = await createUser(req.body);
    
    // Log activity if admin user is creating this user
    if (req.user) {
      logActivity(
        req.user.id,
        'USER_CREATED',
        `${req.user.full_name} created user: ${newUser.full_name} (${newUser.email})`,
        req.ip
      ).catch(console.error);
    }
    
     successResponse(res, newUser, 'User created successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 