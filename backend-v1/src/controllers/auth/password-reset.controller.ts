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

     const user = await PasswordResetService.requestPasswordReset(email);

      logActivity(
        user!.id,
        'USER_REQUEST_PASSWORD_RESET_LINK',               // your activity code
        `${user!.full_name} with email ${email} requested password reset link`, 
        req.ip
      ).catch(console.error);
      
      res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      console.log("forgot",error);
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
        `${user.full_name} successfully updated password`,
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