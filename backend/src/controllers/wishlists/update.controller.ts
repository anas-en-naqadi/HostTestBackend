// src/controllers/wishlists/update.controller.ts
import { Response, NextFunction, Request } from 'express';
import { updateWishlist } from '../../services/wishlists/update.service';
import { AppError } from '../../middleware/error.middleware';

export const updateWishlistController = async (
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

    if (isNaN(courseId)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid course ID',
        data: null
      });
      return;
    }

    const wishlist = await updateWishlist(userId, courseId);
    res.status(200).json({ 
      success: true,
      message: 'Wishlist updated successfully',
      data: wishlist
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Update wishlist error:', error);
      res.status(500).json({ success: false, message: 'Failed to update wishlist' });
    }
  }
};