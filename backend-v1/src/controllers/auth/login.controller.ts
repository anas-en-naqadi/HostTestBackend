import { Request, Response } from "express";
import { LoginService } from "../../services/auth/login.service";
import { ILoginRequest } from "../../types/auth.types";
import { AppError } from "../../middleware/error.middleware";
import { AuthValidation } from "../../validation/auth.validation";
import { logActivity } from "../../utils/activity_log.utils";

export class LoginController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const data: ILoginRequest = req.body;

      // Validate input data
      AuthValidation.validateLogin(data);

      const result = await LoginService.login(data);

      // Generate refresh token
      const refreshToken = result.refreshToken; // Assuming you are getting this from the login service
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: '/', // Set to root path so it's sent with all API requests
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logActivity(
        result.user.id,
        "USER_LOGIN",
        `${result.user.full_name} successfully logged in `,
        req.ip
      ).catch(console.error);
      res.status(200).json({
        token: result.token,
        user: result.user
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}
