import { Request, Response } from 'express';
import { RefreshTokenService } from '../../services/auth/refresh-token.service';
import { AppError } from '../../middleware/error.middleware';
import { logActivity } from '../../utils/activity_log.utils';

export class RefreshTokenController {
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Retrieve the refresh token from cookies
      const refreshToken = req.cookies.refresh_token;

      if (!refreshToken) {
        // Return an error if no refresh token is found
        throw new AppError(400, 'Refresh token is required');
      }

      // Pass the refresh token to the service for verification and generation of a new access token
      const result = await RefreshTokenService.refreshToken(refreshToken);

      logActivity(
        result.user.id,
        'USER_REFRESH_TOKEN',
        `${result.user.full_name} refreshed their access token`,
        req.ip
      ).catch(console.error);

      res
      .cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Set to root path so it's sent with all API requests
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      })
      .status(200)
      .json({
        token: result.accessToken,
        user: result.user
      });
    
    } catch (error) {
      // Catch and handle errors appropriately
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
}
