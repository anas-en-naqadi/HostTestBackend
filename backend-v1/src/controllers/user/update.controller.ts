import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { ApiResponse } from '../../utils/api.utils';
import { updateUser } from '../../services/user';
import { logActivity } from '../../utils/activity_log.utils';

/**
 * Controller to create a new user
 * @param req Express request
 * @param res Express response
 * @returns Response with created user
 */
export const updateUserController = async (
  req: Request, 
  res: Response<ApiResponse<UserResponse>>
): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    if(!userId){
        throw new AppError(400,"the id of user must be an number");
    }
    const newUser = await updateUser(userId,req.body);
    
    // Log activity if admin user is updating this user
    if (req.user) {
      logActivity(
        req.user.id,
        'USER_UPDATED',
        `${req.user.full_name} updated user ID ${userId}: ${newUser.full_name}`,
        req.ip
      ).catch(console.error);
    }
    
     successResponse(res, newUser, 'User updated successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 