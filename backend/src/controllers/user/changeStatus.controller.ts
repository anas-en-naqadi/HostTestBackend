import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { AppError } from '../../middleware/error.middleware';
import { ApiResponse } from '../../utils/api.utils';
import { changeStatus } from '../../services/user';

export const changeStatusController = async (
  req: Request, 
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { status,user_id } = req.body;
   

    if (isNaN(user_id)) {
      throw new AppError(400, 'Invalid user ID');
    }
     if (!status) {
      throw new AppError(400, 'Status value required');
    }

    await changeStatus(user_id,status);
    
   
     successResponse(res, null, 'Account status updated successfully !!');
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof AppError) {
       errorResponse(res, error.message, error.statusCode,error.errors);
    }
    
     errorResponse(res, 'Internal server error');
  }
}; 