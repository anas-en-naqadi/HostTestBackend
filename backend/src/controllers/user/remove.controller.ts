import { Request, Response } from 'express';
import { removeUser } from '../../services/user/remove.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../utils/api.utils';
import { CACHE_KEYS, generateCacheKey, deleteFromCache, clearCacheByPrefix } from '../../utils/cache.utils';
import { logActivity } from '../../utils/activity_log.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Get user details before deletion for logging
    const userToDelete = await prisma.users.findUnique({
      where: { id: userId },
      select: { full_name: true, email: true }
    });
    
    await removeUser(userId);
    
    // Log activity if admin user is removing this user
    if (req.user && userToDelete) {
      logActivity(
        req.user.id,
        'USER_DELETED',
        `${req.user.full_name} deleted user: ${userToDelete.full_name} (${userToDelete.email})`,
        req.ip
      ).catch(console.error);
    }
    
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