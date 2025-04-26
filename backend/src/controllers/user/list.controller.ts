import { Request, Response } from 'express';
import { listUsers } from '../../services/user/list.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import {  UserResponse } from '../../types/user.types';
import { CACHE_KEYS, getFromCache, setInCache } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
/**
 * Controller to get all users
 * @param req Express request
 * @param res Express response
 * @returns Response with list of users
 */
export const listUsersController = async (
  _req: Request, 
  res: Response<ApiResponse<UserResponse[]>>
): Promise<void> => {
  try {
    // Try to get from cache first
    const cachedUsers = await getFromCache<UserResponse[]>(CACHE_KEYS.USERS);
    if (cachedUsers) {
      console.log('Returning users from cache');
       successResponse(res, cachedUsers, 'Users retrieved from cache');
    }

    // If not in cache, get from service
    const users = await listUsers();
    
    // Store in cache for future requests
    await setInCache(CACHE_KEYS.USERS, users);
    console.log('Users stored in cache');
    
     successResponse(res, users);
  } catch (error) {
    console.error('Error fetching users:', error);
     errorResponse(res, 'Internal server error');
  }
}; 