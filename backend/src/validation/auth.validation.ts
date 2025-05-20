import {
  ILoginRequest,
  IRegisterRequest,
  IResetPasswordRequest,
  IEmailVerificationRequest,
} from "../types/auth.types";
import { AppError } from "../middleware/error.middleware";

export class AuthValidation {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  public static errors : String[] = [];
  private static passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  private static usernameRegex = /^@[a-zA-Z0-9_]+$/;

  static validateLogin(data: ILoginRequest): void {
    if (!data.email || !data.password) {
      throw new AppError(400, "Email and password are required");
    }

    if (!this.emailRegex.test(data.email)) {
      throw new AppError(400, "Invalid email format");
    }

    if (data.password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters long");
    }
  }

  static validateRegister(data: IRegisterRequest): void {
    if (
      !data.email ||
      !data.password ||
      !data.password_confirmation ||
      !data.full_name ||
      !data.username
    ) {
      throw new AppError(400, "All fields are required");
    }

    if (!this.emailRegex.test(data.email)) {
      throw new AppError(400, "Invalid email format");
    }

    if (data.password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters long");
    }
    this.validatePassword(data.password);

    if (data.password !== data.password_confirmation) {
      throw new AppError(400, "Passwords do not match");
    }

    if (!this.usernameRegex.test(data.username)) {
      throw new AppError(
        400,
        "Username must start with @ and can only contain letters, numbers, and underscores"
      );
    }

    if (data.full_name.length < 2) {
      throw new AppError(400, "Full name must be at least 2 characters long");
    }
  }
  private static validatePassword(password: string): void {
    this.errors.length = 0;
    // Check minimum length
    if (password.length < 8) {
     this.errors.push("Password must be at least 8 characters long");
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
     this.errors.push("Password must contain at least one uppercase letter");
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
     this.errors.push("Password must contain at least one lowercase letter");
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
      this.errors.push("Password must contain at least one number");
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
     this.errors.push("Password must contain at least one special character");
    }
    if(this.errors.length > 0){
      throw new AppError(422,'Validation errors',this.errors);
    }
  }

  static validateResetPassword(data: IResetPasswordRequest): void {
    if (!data.token || !data.new_password || !data.password_confirmation) {
      throw new AppError(
        400,
        "Token, new password, and password confirmation are required"
      );
    }

    if (data.new_password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters long");
    }

    if (!this.passwordRegex.test(data.new_password)) {
      throw new AppError(
        400,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }

    if (data.new_password !== data.password_confirmation) {
      throw new AppError(400, "Passwords do not match");
    }
  }

  static validateEmailVerification(data: IEmailVerificationRequest): void {
    if (!data.token) {
      throw new AppError(400, "Verification token is required");
    }
  }

  static validateForgotPassword(email: string): void {
    if (!email) {
      throw new AppError(400, "Email is required");
    }

    if (!this.emailRegex.test(email)) {
      throw new AppError(400, "Invalid email format");
    }
  }
}
