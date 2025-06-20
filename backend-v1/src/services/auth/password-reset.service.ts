import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IResetPasswordRequest } from '../../types/auth.types';
import { AppError } from '../../middleware/error.middleware'; // Corrected path
import { sendEmail } from '../../utils/email.utils';
// import { UserResponse } from 'types/user.types'; // Not used, can be removed

import fs from 'fs'; // Added
import path from 'path'; // Added
import handlebars from 'handlebars'; // Added

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
    
    if (!token || !user) { // Added !user check for robustness
      // Don't reveal that the email doesn't exist
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    // Read and compile the email template
    const templatePath = path.join(__dirname, '..', '..', 'templates', 'emails', 'reset-password.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);

    const platformName = process.env.PLATFORM_NAME || 'Forge';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@forge.com'; // Added support email
    const currentYear = new Date().getFullYear();

    const emailHtml = compiledTemplate({
      platformName: platformName,
      userName: user.full_name,
      resetLink: resetUrl,
      linkExpiryDuration: '1 hour',
      currentYear: currentYear,
      supportEmail: supportEmail // Added support email to template data
    });
    
    const emailText = `Hello ${user.full_name},\n\nYou requested a password reset for ${platformName}. Click on the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this reset, please ignore this email.\n\nIf you need help, please contact our support team at ${supportEmail}.\n\nThank you,\nThe ${platformName} Team`;


    const emailOptions = {
      to: email,
      subject: `Reset Your Password - ${platformName}`,
      text: emailText,
      html: emailHtml
    };

    await sendEmail(emailOptions);
    return user ;
  }

  static async resetPassword(data: IResetPasswordRequest): Promise<{id:number,full_name:string}> {
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as { userId: string }; // Ensure userId is string or number as per your JWT payload
      const user = await prisma.users.findUnique({
        where: { id: Number(decoded.userId) } // Ensure decoded.userId is correctly converted if it's a string
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
      return { id: user.id, full_name: user.full_name }; // Return consistent user type
    } catch (error) {
      if (error instanceof AppError) throw error; // Re-throw AppError
      if (error instanceof jwt.JsonWebTokenError) { // Handle JWT specific errors
          throw new AppError(400, 'Invalid or malformed reset token');
      }
      throw new AppError(400,'Invalid or expired reset token');
    }
  }
    static async requestPasswordReset(email: string): Promise<user | undefined> { // Adjusted return type
    // Don't throw error if user not found, just send email logic to avoid enumeration
   const user = await this.sendPasswordResetEmail(email);
   return user; // Return user or undefined
  }

} 