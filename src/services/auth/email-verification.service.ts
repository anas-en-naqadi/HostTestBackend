import { user_status, Prisma } from "@prisma/client";
import crypto from "crypto";
import { AppError } from "../../middleware/error.middleware";
import { sendEmail } from "../../utils/email.utils";
import prisma from "../../config/prisma";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";

// Interface for email template data
interface EmailTemplateData {
  userName: string;
  verificationUrl: string;
  tempPassword?: string;
  platformName: string;
  supportEmail: string;
  currentYear: number;
}

export class EmailVerificationService {
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
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
          verification_token: true,
        },
      });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      if (user.email_verified) {
        throw new AppError(400, "Email already verified");
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      // Update user with verification token
      await prisma.users.update({
        where: { id: userId },
        data: { verification_token: verificationToken },
      });

      // Generate verification URL
      const verificationUrl = `${
        process.env.FRONTEND_URL
      }/verify-email?token=${verificationToken}&ref=${btoa(userId.toString())}`;

      // Prepare template data
      const templateData: EmailTemplateData = {
        userName: user.full_name,
        verificationUrl,
        platformName: "AcadeMe",
        supportEmail: process.env.SUPPORT_EMAIL || "support@academe.com",
        currentYear: new Date().getFullYear(),
      };

      // Generate HTML content from template
      const htmlContent = this.generateVerificationOnlyTemplate(templateData);

      // Send email
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email Address - AcadeMe",
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to send verification email");
    }
  }

  static async verifyEmail(
    token: string,
    hashedId: string
  ): Promise<{ id: number; full_name: string }> {
    try {
      // Decode the hashed ID
      const userId = parseInt(atob(hashedId));

      if (isNaN(userId)) {
        throw new AppError(400, 'Invalid user ID');
      }
      // Find user with verification token
      const user = await prisma.users.findFirst({
        where: { id: userId },
        select: {
          id: true,
          email_verified: true,
          verification_token: true,
          status: true,
          full_name: true,
        },
      });

      if (!user) {
        throw new AppError(400, "Invalid or expired verification token");
      }

      if (user.email_verified) {
        throw new AppError(400, "Email already verified");
      }

      // Update user
      await prisma.users.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          verification_token: null,
          status: user_status.active,
        },
      });
      return user;
    } catch (error) {
      console.error("Error verifying email:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to verify email");
    }
  }

  static async resendVerificationEmail(
    email: string
  ): Promise<{ id: number; full_name: string }> {
    try {
      // Find user by email
      const user = await prisma.users.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          full_name: true,
          email_verified: true,
          verification_token: true,
        },
      });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      if (user.email_verified) {
        throw new AppError(400, "Email already verified");
      }

      // Generate new verification token
      const verificationToken = this.generateVerificationToken();

      // Update user with new verification token
      await prisma.users.update({
        where: { id: user.id },
        data: { verification_token: verificationToken },
      });

      // Generate verification URL
      const verificationUrl = `${
        process.env.FRONTEND_URL
      }/verify-email?token=${verificationToken}&ref=${btoa(user.id.toString())}`;

      // Prepare template data
      const templateData: EmailTemplateData = {
        userName: user.full_name,
        verificationUrl,
        platformName: "AcadeMe",
        supportEmail: process.env.SUPPORT_EMAIL || "support@academe.com",
        currentYear: new Date().getFullYear(),
      };

      // Generate HTML content from template
      const htmlContent = this.generateVerificationOnlyTemplate(templateData);

      // Send email
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email Address - AcadeMe",
        html: htmlContent,
      });
      return user;
    } catch (error) {
      console.error("Error resending verification email:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to resend verification email");
    }
  }

  /**
   * Sends a verification email with temporary password using a styled HTML template
   * @param userId User ID to send verification email to
   * @param tempPassword Temporary password for the user
   * @returns Promise resolving to void
   */
  static async sendVerificationEmailWithPassword(
    userId: number,
    tempPassword: string
  ): Promise<void> {
    try {
      // Find user
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          email_verified: true,
          verification_token: true,
        },
      });

      if (!user) {
        throw new AppError(404, "User not found");
      }

      if (user.email_verified) {
        throw new AppError(400, "Email already verified");
      }

      // Generate verification token
      const verificationToken = this.generateVerificationToken();

      // Update user with verification token
      await prisma.users.update({
        where: { id: userId },
        data: { verification_token: verificationToken },
      });

      // Generate verification URL
      const verificationUrl = `${
        process.env.FRONTEND_URL
      }/verify-email?token=${verificationToken}&ref=${btoa(userId.toString())}`;

      // Prepare template data
      const templateData: EmailTemplateData = {
        userName: user.full_name,
        verificationUrl,
        tempPassword,
        platformName: "AcadeMe",
        supportEmail: process.env.SUPPORT_EMAIL || "support@academe.com",
        currentYear: new Date().getFullYear(),
      };

      // Generate HTML content from template
      const htmlContent = this.generateEmailTemplate(templateData);

      // Send email
      await sendEmail({
        to: user.email,
        subject:
          "Welcome to AcadeMe - Verify Your Email and Access Your Account",
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error sending verification email with password:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        500,
        "Failed to send verification email with password"
      );
    }
  }

  /**
   * Generates HTML email content from template for emails with password
   * @param data Template data
   * @returns HTML content as string
   */
  private static generateEmailTemplate(data: EmailTemplateData): string {
    try {
      // Read the template file
      const templatePath = path.resolve(
        __dirname,
        "../../templates/emails/verification-email.hbs"
      );
      const template = fs.readFileSync(templatePath, "utf8");

      // Compile the template
      const compiledTemplate = Handlebars.compile(template);

      // Return the HTML with data applied
      return compiledTemplate(data);
    } catch (error) {
      console.error("Error reading email template:", error);
      throw new AppError(500, "Failed to generate email template");
    }
  }

  /**
   * Generates HTML email content from template for verification-only emails
   * @param data Template data
   * @returns HTML content as string
   */
  private static generateVerificationOnlyTemplate(
    data: EmailTemplateData
  ): string {
    try {
      // Read the template file
      const templatePath = path.resolve(
        __dirname,
        "../../templates/emails/verification-only-email.hbs"
      );
      const template = fs.readFileSync(templatePath, "utf8");

      // Compile the template
      const compiledTemplate = Handlebars.compile(template);

      // Return the HTML with data applied
      return compiledTemplate(data);
    } catch (error) {
      console.error("Error reading verification-only email template:", error);
      throw new AppError(
        500,
        "Failed to generate verification-only email template"
      );
    }
  }
}
