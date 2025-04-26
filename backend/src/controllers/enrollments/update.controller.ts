import { Response, NextFunction, Request } from 'express';
import { updateEnrollmentProgress } from '../../services/enrollments/update.service';
import { AppError } from '../../middleware/error.middleware';

export const putEnrollmentController = async (
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
    const { progressPercent } = req.body;

    if (isNaN(enrollmentId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid enrollment ID',
        data: null
      });
      return;
    }
    if (progressPercent === undefined || isNaN(progressPercent)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid progress percent is required',
        data: null
      });
      return;
    }

    const updatedEnrollment = await updateEnrollmentProgress(enrollmentId, userId, Number(progressPercent));
    res.status(200).json({ 
      success: true, 
      message: 'Enrollment progress updated successfully', 
      data: updatedEnrollment 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Update enrollment error:', error);
      res.status(500).json({ success: false, message: 'Failed to update enrollment progress' });
    }
  }
};
