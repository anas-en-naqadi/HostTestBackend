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

    // Extract pagination parameters from query string
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;

    const userId = user.id;
    const paginatedWishlists = await getWishlists(userId, page, limit);
    
    res.status(200).json({ 
      success: true,
      message: 'Wishlist retrieved successfully',
      data: paginatedWishlists.wishlists,
      pagination: {
        totalCount: paginatedWishlists.totalCount,
        totalPages: paginatedWishlists.totalPages,
        currentPage: paginatedWishlists.currentPage,
        limit: limit
      }
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