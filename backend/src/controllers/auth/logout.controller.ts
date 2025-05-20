import { Request, Response } from 'express';
import { LogoutService } from '../../services/auth/logout.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

export class LogoutController {
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(401, 'User not authenticated');
      }

      // Get token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'No token provided');
      }
      const token = authHeader.split(' ')[1];

      // Call logout service
      await LogoutService.logout(userId, token);

      res.clearCookie('refresh_token', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      logActivity(
        userId,
        'USER_LOGOUT',
        `${req.user?.full_name} logged out`,
        req.ip
      ).catch(console.error);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
}
