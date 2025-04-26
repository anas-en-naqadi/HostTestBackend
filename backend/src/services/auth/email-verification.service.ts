import { user_status, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../../middleware/error.middleware';
import { sendEmail } from '../../utils/email.utils';
import prisma from '../../config/prisma';


export class EmailVerificationService {
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async sendVerificationEmail(userId: number): Promise<void> {
    try {
      // Find user
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          email_verified: true,
          verification_token: true
        }
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.email_verified) {
        throw new AppError(400, 'Email already verified');
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      // Update user with verification token
      await prisma.users.update({
        where: { id: userId },
        data: { verification_token: verificationToken }
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <h1>Email Verification</h1>
          <p>Hello ${user.full_name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to send verification email');
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    try {
      // Find user with verification token
      const user = await prisma.users.findFirst({
        where: { verification_token: token },
        select: {
          id: true,
          email_verified: true,
          verification_token: true,
          status: true
        }
      });

      if (!user) {
        throw new AppError(400, 'Invalid or expired verification token');
      }

      if (user.email_verified) {
        throw new AppError(400, 'Email already verified');
      }

      // Update user
      await prisma.users.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          verification_token: null,
          status: user_status.active
        }
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to verify email');
    }
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    try {
      // Find user by email
      const user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          full_name: true,
          email_verified: true,
          verification_token: true
        }
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      if (user.email_verified) {
        throw new AppError(400, 'Email already verified');
      }

      // Generate new verification token
      const verificationToken = this.generateVerificationToken();

      // Update user with new verification token
      await prisma.users.update({
        where: { id: user.id },
        data: { verification_token: verificationToken }
      });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: `
          <h1>Email Verification</h1>
          <p>Hello ${user.full_name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}">Verify Email</a>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to resend verification email');
    }
  }
} 