import { Request, Response } from 'express';
import { updateUserProfile } from '../../services/user/update_profile.service';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { z } from 'zod';
import { CACHE_KEYS, generateCacheKey, deleteFromCache, clearCacheByPrefix } from '../../utils/cache.utils';
import { ApiResponse } from '../../utils/api.utils';
import { logActivity } from '../../utils/activity_log.utils';
import prisma from '../../config/prisma';

/**
 * Controller to update a user's profile
 * @param req Express request
 * @param res Express response
 * @returns Response with updated user data
 */
export const updateProfileController = async (
  req: Request, 
  res: Response<ApiResponse<UserResponse>>
): Promise<void> => {
  try {
    // Get user ID from request params
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
       errorResponse(res, 'Invalid user ID', 400);
    }

    // Get the current user's info for the activity log
    const currentUser = req.user;
    if (!currentUser) {
      throw new AppError(401, 'User not authenticated');
    }
    
    // Update user profile
    const updatedUser = await updateUserProfile(userId, req.body);
    
    // Log the activity
    const activityMessage = `${currentUser.full_name} updated their own profile`;
      
    logActivity(
      currentUser.id,
      'PROFILE_UPDATED',
      activityMessage,
      req.ip
    ).catch(console.error);
    
    // Invalidate caches
    try {
      // Delete the specific user cache
      const userCacheKey = generateCacheKey(CACHE_KEYS.USER, userId);
      await deleteFromCache(userCacheKey);
      
      // Clear the users list cache
      await clearCacheByPrefix(CACHE_KEYS.USERS);
      
      console.log(`Cache invalidated for user ${userId} and users list after profile update`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
      // Continue execution even if cache invalidation fails
    }
    
     successResponse(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error instanceof z.ZodError) {
       errorResponse(res, 'Validation error', 400, error.errors);
    }
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 