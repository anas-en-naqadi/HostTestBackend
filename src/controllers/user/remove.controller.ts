import { Request, Response } from 'express';
import { removeUser } from '../../services/user/remove.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../utils/api.utils';
import { CACHE_KEYS, generateCacheKey, deleteFromCache, clearCacheByPrefix } from '../../utils/cache.utils';

/**
 * Controller to delete a user
 * @param req Express request
 * @param res Express response
 * @returns Response with success message
 */
export const removeUserController = async (
  req: Request, 
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(400, 'Invalid user ID');
    }

    await removeUser(userId);
    
    // Invalidate caches
    try {
      // Delete the specific user cache
      const userCacheKey = generateCacheKey(CACHE_KEYS.USER, userId);
      await deleteFromCache(userCacheKey);
      
      // Clear the users list cache
      await clearCacheByPrefix(CACHE_KEYS.USERS);
      
      console.log(`Cache invalidated for user ${userId} and users list after deletion`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Continue execution even if cache invalidation fails
    }
    
     successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 