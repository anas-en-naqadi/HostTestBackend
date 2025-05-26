// src/controllers/wishlists/create.controller.ts
import { Response, NextFunction, Request } from 'express';
import { createWishlist } from '../../services/wishlists/create.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

export const createWishlistController = async (
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
    const courseId = req.body.course_id;
    const mainCourseId = req.body?.main_course_id || null;
    const ipAddress = req.ip;

    if (!courseId || isNaN(courseId)) {
      res.status(400).json({ 
        success: false,
        message: 'Valid course ID is required',
        data: null
      });
      return;
    }

    const wishlist = await createWishlist(userId, Number(courseId),mainCourseId);

     // Log the activity
     await logActivity(
      userId,
      'WISHLIST_ADD',
      `${user.full_name} added course ID ${courseId} to wishlist`,
      ipAddress
    ).catch(console.error);

    res.status(201).json({ 
      success: true,
      message: 'Course added to wishlist successfully',
      data: wishlist
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Create wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to create wishlist' });
    }
  }
};