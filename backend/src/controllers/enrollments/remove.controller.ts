import { Response, NextFunction, Request } from 'express';
import { deleteEnrollment } from '../../services/enrollments/remove.service';
import { AppError } from '../../middleware/error.middleware';

export const deleteEnrollmentController = async (
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
    const enrollmentId = parseInt(req.params.id, 10);

    if (isNaN(enrollmentId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid enrollment ID',
        data: null
      });
      return;
    }

    await deleteEnrollment(enrollmentId, userId);
    res.status(200).json({ 
      success: true, 
      message: 'Enrollment deleted successfully', 
      data: null 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Delete enrollment error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete enrollment' });
    }
  }
};