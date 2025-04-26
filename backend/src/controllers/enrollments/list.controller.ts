import { Response, NextFunction, Request } from 'express';
import { getEnrollments } from '../../services/enrollments/list.service';
import { AppError } from '../../middleware/error.middleware';

export const getEnrollmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from authenticated user
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const userId = user.id;
    const enrollments = await getEnrollments(userId);
    res.status(200).json({ 
      success: true, 
      message: 'Enrollments retrieved successfully', 
      data: enrollments 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Get enrollments error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve enrollments' });
    }
  }
};
