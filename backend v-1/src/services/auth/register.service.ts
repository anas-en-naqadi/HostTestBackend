import { PrismaClient, user_status } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../../middleware/error.middleware";
import { IRegisterRequest } from "../../types/auth.types";
import { EmailVerificationService } from "./email-verification.service";

const prisma = new PrismaClient();

export class RegisterService {

  private static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private static async validateEmail(email: string): Promise<void> {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "Email already registered");
    }
  }

  private static async validateUsername(username: string): Promise<void> {
    const existingUser = await prisma.users.findFirst({
      where: { username },
    });

    if (existingUser) {
    throw new AppError(400, "Username already taken");
    }
  }

  static async register(data: IRegisterRequest) {
    try {
      console.log("Starting registration process for:", data.email);

      // Validate email and username uniqueness
      await this.validateEmail(data.email);
      await this.validateUsername(data.username);
    
      // Hash password
      const hashedPassword = await this.hashPassword(data.password);
      const role = await prisma.roles.findUnique({ where: { name: "intern" } });

      if (!role) {
        throw new AppError(500, "Default role not found");
      }

      // Create user
      const user = await prisma.users.create({
        data: {
          email: data.email,
          password_hash: hashedPassword,
          full_name: data.full_name,
          username: data.username,
          role_id: role.id,
          status: user_status.inactive,
          email_verified: false,
        },
        include: {
          roles: true,
        },
      });

      console.log("User registered successfully:", user.id);

      // Send verification email
      await EmailVerificationService.sendVerificationEmail(user.id);


      return user ;
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, "Failed to register user");
    }
  }
}
