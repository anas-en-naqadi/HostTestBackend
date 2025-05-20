// src/controllers/wishlists/remove.controller.ts
import { Response, NextFunction, Request } from 'express';
import { deleteWishlist } from '../../services/wishlists/remove.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

export const removeWishlistController = async (
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
    const courseId = parseInt(req.params.courseId, 10);
    const mainCourseId = parseInt(req.body?.main_course_id, 10) || null;

console.log("test",req.body,req.params)
    if (isNaN(courseId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid course ID',
        data: null
      });
      return;
    }

    await deleteWishlist(userId, courseId,mainCourseId);

    await logActivity(
      userId,
      'WISHLIST_REMOVE',
      `${user.full_name} removed course ${courseId} from wishlist`,
      req.ip
    ).catch(console.error);

    res.status(200).json({ 
      success: true,
      message: 'Course removed from wishlist successfully',
      data: null
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Remove wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to remove course from wishlist' });
    }
  }
};