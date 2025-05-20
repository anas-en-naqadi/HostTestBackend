import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { UserResponse } from '../../types/user.types';
import { ApiResponse } from '../../utils/api.utils';
import { updateUser } from '../../services/user';

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
    
     successResponse(res, newUser, 'User updated successfully', 201);
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 