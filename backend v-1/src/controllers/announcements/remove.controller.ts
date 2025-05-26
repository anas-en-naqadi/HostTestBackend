// src/controllers/announcements/remove.controller.ts
import { Response, NextFunction, Request } from 'express';
import { deleteAnnouncement } from '../../services/announcements/remove.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

export const removeAnnouncementController = async (
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
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid announcement ID',
        data: null
      });
      return;
    }

    await deleteAnnouncement(userId, id);

    logActivity(
      userId,
      'ANNOUNCEMENT_DELETED',
      `${req.user!.full_name} deleted announcement ID ${id}`,
      req.ip
    ).catch(console.error);

    
    res.status(200).json({ 
      success: true,
      message: 'Announcement deleted successfully',
      data: null
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ success: false, message: 'Failed to delete announcement' });
    }
  }
};