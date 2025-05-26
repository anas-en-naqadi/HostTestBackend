import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IResetPasswordRequest } from '../../types/auth.types';
import { AppError } from '../../middleware/error.middleware';
import { sendEmail } from '../../utils/email.utils';
import { UserResponse } from 'types/user.types';

const prisma = new PrismaClient();
type user = {id:number,full_name:string};
interface promiseReturn {
  user:user;
  token:string;
}
export class PasswordResetService {
  private static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async generateResetToken(email: string): Promise<promiseReturn> {
    const user = await prisma.users.findUnique({
      where: { email } , select:{id:true,full_name:true}
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      throw new AppError(400,'User with this email not found') ;
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour from now

    await prisma.users.update({
      where: { id: user.id },
      data: { 
        reset_token: token,
        reset_token_expiry: expiryDate,
        updated_at: new Date()
      }
    });

    return {token,user};
  }

  static async sendPasswordResetEmail(email: string): Promise<{id:number,full_name:string} | undefined> {
    const {token,user} = await this.generateResetToken(email);
    
    if (!token) {
      // Don't reveal that the email doesn't exist
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const emailOptions = {
      to: email,
      subject: 'Reset your password',
      text: `You requested a password reset. Click on the following link to reset your password: ${resetUrl}`,
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click on the following link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you did not request this reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `
    };

    await sendEmail(emailOptions);
    return user ;
  }

  static async resetPassword(data: IResetPasswordRequest): Promise<{id:number,full_name:string}> {
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.users.findUnique({
        where: { id: Number(decoded.userId) }
      });

      if (!user) {
        throw new AppError(400,'Invalid reset token');
      }

      if (user.reset_token !== data.token) {
        throw new AppError(400,'Invalid reset token');
      }

      if (user.reset_token_expiry && user.reset_token_expiry < new Date()) {
        throw new AppError(400,'Reset token has expired');
      }

      const hashedPassword = await this.hashPassword(data.new_password);
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password_hash: hashedPassword,
          reset_token: null,
          reset_token_expiry: null,
          updated_at: new Date()
        }
      });
      return user;
    } catch (error) {
      throw new AppError(400,'Invalid or expired reset token');
    }
  }
    static async requestPasswordReset(email: string): Promise<user> {
    // Don't throw error if user not found, just send email logic to avoid enumeration
   const user = await this.sendPasswordResetEmail(email);
   return user!;
  }

} 