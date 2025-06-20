import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';
import jwt from 'jsonwebtoken';

export class TokenBlacklistService {
  static async addToBlacklist(token: string): Promise<void> {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token) as { exp?: number };
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
      }

      // Convert expiration timestamp to Date
      const expiresAt = new Date(decoded.exp * 1000);

      // Add token to blacklist
      await prisma.token_blacklist.create({
        data: {
          token,
          expires_at: expiresAt
        }
      });
    } catch (error) {
      console.error('Error adding token to blacklist:', error);
      throw error;
    }
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await prisma.token_blacklist.findUnique({
        where: { token }
      });

      return !!blacklistedToken;
    } catch (error) {
      console.error('Error checking token blacklist:', error);
      return false;
    }
  }

  static async cleanupExpiredTokens(): Promise<void> {
    try {
      await prisma.token_blacklist.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
} 