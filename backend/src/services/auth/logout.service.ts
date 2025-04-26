import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import prisma from '../../config/prisma';
import { TokenBlacklistService } from './token-blacklist.service';

export class LogoutService {
  static async logout(userId: number, token: string): Promise<void> {
    try {
      // Find user
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // Add token to blacklist
      await TokenBlacklistService.addToBlacklist(token);

      // Update last_login to null
      await prisma.users.update({
        where: { id: userId },
        data: { last_login: null }
      });

    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to logout');
    }
  }
}
