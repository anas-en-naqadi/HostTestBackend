import { Request, Response } from 'express';
import { createUser } from '../../services/user/create.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { CACHE_KEYS, clearCacheByPrefix } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
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
    
    
     successResponse(res, newUser, 'User created successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 