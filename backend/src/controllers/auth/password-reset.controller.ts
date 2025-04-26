import { Request, Response } from 'express';
import { PasswordResetService } from '../../services/auth/password-reset.service';
import { IResetPasswordRequest } from '../../types/auth.types';
import { AppError } from '../../middleware/error.middleware';
import { AuthValidation } from '../../validation/auth.validation';
import { logActivity } from '../../utils/activity_log.utils';
export class PasswordResetController {
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      // Validate email
      AuthValidation.validateForgotPassword(email);

      await PasswordResetService.requestPasswordReset(email);
      
      res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const data: IResetPasswordRequest = req.body;
      
      // Validate reset password data
      AuthValidation.validateResetPassword(data);

      const user = await PasswordResetService.resetPassword(data);
      logActivity(
        user.id,
        'USER_UPDATE_PASSWORD',
        `${user.full_name} successfully updated password from login page `,
        req.ip
      ).catch(console.error);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
} 