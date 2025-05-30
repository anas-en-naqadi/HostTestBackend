import { Request, Response, NextFunction } from 'express';
import { RegisterService } from '../../services/auth/register.service';
import { AuthValidation } from '../../validation/auth.validation';
import { logActivity } from '../../utils/activity_log.utils';
import { notifyAllAdmins } from '../../utils/notification.utils';
export class RegisterController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, password_confirmation, full_name, username } = req.body;

      // Validate input data
      AuthValidation.validateRegister({
        email,
        password,
        password_confirmation,
        full_name,
        username
      });

      const user = await RegisterService.register({
        email,
        password,
        full_name,
        password_confirmation,
        username
      });

      logActivity(
        user.id,
        'USER_REGISTER',
        `${user.full_name} successfully registered in `,
        req.ip
      ).catch(console.error);

      notifyAllAdmins({
        title: 'New Intern Registered',
        type: 'INTERN_REGISTRATION',
        content: `A new intern has registered: ${user.full_name} (${user.email}).`,
        metadata: {
          intern_name: user.full_name,
          intern_email: user.email,
        }
      },user.id).catch(console.error);

      res.status(201).json({
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
