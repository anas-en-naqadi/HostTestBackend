import { Request, Response } from 'express';
import { listUsers } from '../../services/user/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import {  UserResponse } from '../../types/user.types';
import { CACHE_KEYS, getFromCache, setInCache } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
/**
 * Controller to get all users
 * @param req Express request
 * @param res Express response
 * @returns Response with list of users
 */
export const listUsersController = async (
  req: Request, 
  res: Response<ApiResponse<UserResponse[]>>
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if(!userId){
      throw new AppError(401,'User is unauthenticated');
    }
    // If not in cache, get from service
    const users = await listUsers(userId);
      
     successResponse(res, users);
  } catch (error) {
    console.error('Error fetching users:', error);
     errorResponse(res, 'Internal server error');
  }
}; 