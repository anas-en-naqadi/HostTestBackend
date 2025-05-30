import { PrismaClient, user_status } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middleware/error.middleware';
import { ITokenPayload } from '../../types/auth.types';

const prisma = new PrismaClient();

export class RefreshTokenService {
  static async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as ITokenPayload;

      // Find user
      const user = await prisma.users.findUnique({
        where: { id: Number(decoded.id) },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true,
                  roles:true
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new AppError(401, 'User not found');
      }

      if (user.status !== user_status.active) {
        throw new AppError(401, 'User account is not active');
      }
      if(!user.roles){
        throw new AppError(500, 'User role not found');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.roles.name
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.roles.name
        },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.roles.name ,
          status: user.status,
          permissions: user.roles?.role_permissions.map(rp => rp.permissions.name) || []
        }
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }
} 