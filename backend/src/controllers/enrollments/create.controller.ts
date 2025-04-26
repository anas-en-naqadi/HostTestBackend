import { Response, NextFunction, Request } from 'express';
import { createEnrollment } from '../../services/enrollments/create.service';
import { AppError } from '../../middleware/error.middleware';

export const postEnrollmentController = async (
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
    const { courseId } = req.body;

    if (!courseId || isNaN(courseId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid course ID is required',
        data: null
      });
      return;
    }

    const enrollment = await createEnrollment(userId, Number(courseId));
    res.status(201).json({ 
      success: true, 
      message: 'Enrollment created successfully', 
      data: enrollment 
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      console.error('Create enrollment error:', error);
      res.status(500).json({ success: false, message: 'Failed to create enrollment' });
    }
  }
};
