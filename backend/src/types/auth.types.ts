import { user_status } from '@prisma/client';

export interface IUser {
  id: number;
  email: string;
  full_name: string;
  username: string;
  role: string;
  status: user_status;
  email_verified: boolean;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  INTERN = 'intern'
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  password_confirmation: string;
  full_name: string;
  username: string;
}

export interface IResetPasswordRequest {
  token: string;
  new_password: string;
  password_confirmation: string;
}

export interface IEmailVerificationRequest {
  token: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken: string;
}

export interface ITokenPayload {
  id: string;
  email: string;
  role: string;
  status: user_status;
  permissions: string[];
}

export interface IEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}
