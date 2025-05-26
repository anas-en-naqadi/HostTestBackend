import { Request, Response } from 'express';
import { EmailVerificationService } from '../../services/auth/email-verification.service';
import { AppError } from '../../middleware/error.middleware';
import { AuthValidation } from '../../validation/auth.validation';
import { logActivity } from '../../utils/activity_log.utils';

export class EmailVerificationController {
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      // Validate token
      AuthValidation.validateEmailVerification({ token });

      // Verify email
    const user =  await EmailVerificationService.verifyEmail(token);

      logActivity(
        user.id,
        'USER_EMAIL_VERIFIED',
        `${user.full_name} verified their email`,
        req.ip
      ).catch(console.error);

      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  static async resendVerificationEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Validate email
      AuthValidation.validateForgotPassword(email);

      // Resend verification email
   const user =   await EmailVerificationService.resendVerificationEmail(email);
   
      logActivity(
        user.id,
        'USER_RESEND_VERIFICATION',
        `${user.full_name} requested a new verification email`,
        req.ip
      ).catch(console.error);

      res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
} 