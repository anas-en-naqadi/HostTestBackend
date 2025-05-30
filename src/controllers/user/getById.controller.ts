import { Request, Response } from 'express';
import { getUserById } from '../../services/user/getById.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { CACHE_KEYS, generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
/**
 * Controller to get a user by ID
 * @param req Express request
 * @param res Express response
 * @returns Response with user data
 */
export const getUserByIdController = async (
  req: Request, 
  res: Response<ApiResponse<UserResponse>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    // Try to get from cache first
    const cacheKey = generateCacheKey(CACHE_KEYS.USER, userId);
    const cachedUser = await getFromCache<UserResponse>(cacheKey);
    if (cachedUser) {
      console.log(`Returning user ${userId} from cache`);
       successResponse(res, cachedUser, 'User retrieved from cache');
    }

    // If not in cache, get from service
    const user = await getUserById(userId);
    
    // Store in cache for future requests
    await setInCache(cacheKey, user);

    
     successResponse(res, user);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 