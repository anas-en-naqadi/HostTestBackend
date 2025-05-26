import nodemailer from 'nodemailer';
import { AppError } from '../middleware/error.middleware';
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'academe@gmail.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new AppError(500, 'Failed to send email');
  }
} 