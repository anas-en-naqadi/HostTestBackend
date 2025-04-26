// src/controllers/wishlists/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getWishlists } from '../../services/wishlists/list.service';
import { AppError } from '../../middleware/error.middleware';

export const listWishlistsController = async (
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
    const wishlists = await getWishlists(userId);
    res.status(200).json({ 
      success: true,
      message: 'Wishlist retrieved successfully',
      data: wishlists
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('List wishlists error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve wishlists' });
    }
  }
};