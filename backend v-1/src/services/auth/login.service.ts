import { PrismaClient, user_status, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ILoginRequest, IAuthResponse, ITokenPayload } from '../../types/auth.types';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

type UserWithRoles = Prisma.usersGetPayload<{
  include: {
    roles: {
      include: {
        role_permissions: {
          include: {
            permissions: true
          }
        }
      }
    }
  }
}>;

export class LoginService {
  private static async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private static validateJwtSecrets() {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      console.error('JWT Configuration:', {
        hasJwtSecret: !!jwtSecret,
        hasJwtRefreshSecret: !!jwtRefreshSecret,
        envKeys: Object.keys(process.env).filter(key => key.includes('JWT'))
      });
      throw new AppError(500, 'JWT secrets are not configured');
    }

    return { jwtSecret, jwtRefreshSecret };
  }

  private static generateTokens(payload: ITokenPayload): { token: string; refreshToken: string } {
    const { jwtSecret, jwtRefreshSecret } = this.validateJwtSecrets();
    
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: '7d' });
    return { token, refreshToken };
  }

  static async login(data: ILoginRequest): Promise<IAuthResponse> {
    try {
      console.log('Attempting login for email:', data.email);
      
      // Find user by email
      const user = await prisma.users.findUnique({
        where: { email: data.email },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      }) as UserWithRoles | null;

      if (!user) {
        console.log('User not found for email:', data.email);
        throw new AppError(400, 'Invalid credentials');
      }

      console.log('User found:', { id: user.id, email: user.email, status: user.status });

      // Check if user is active
      if (user.status !== user_status.active) {
        console.log('User account is not active:', user.status);
        throw new AppError(400, 'Account is not active');
      }

      // Check if email is verified
      if (!user.email_verified) {
        console.log('User email not verified:', user.email);
        throw new AppError(400, 'Email not verified. Please check your email for verification link.');
      }

      // Verify password
      const isPasswordValid = await this.comparePasswords(data.password, user.password_hash);
      if (!isPasswordValid) {
        console.log('Invalid password for user:', user.email);
        throw new AppError(400, 'Invalid credentials');
      }

      console.log('Password verified successfully');

      // Get user permissions
      const permissions = user.roles?.role_permissions?.map(rp => rp.permissions.name) || [];
      console.log('User permissions:', permissions);

      // Ensure role name is not null
      if (!user.roles?.name) {
        console.log('User role name is null for user:', user.email);
        throw new AppError(500, 'User role not found');
      }

      // Generate tokens
      console.log('Generating tokens for user:', user.email);
      const { token, refreshToken } = this.generateTokens({
        id: user.id.toString(),
        email: user.email,
        role: user.roles.name,
        status: user.status,
        permissions
      });

      // Update last login timestamp
      console.log('Updating last login timestamp');
      await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date(),is_online:true }
      });

      console.log('Login successful for user:', user.email);

      
      // Return user data and tokens
      return {
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          email: user.email,
          role: user.roles.name,
          status: user.status,
          email_verified: false,
          last_login: user.last_login || undefined,
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Login error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown error type',
        env: {
          hasJwtSecret: !!process.env.JWT_SECRET,
          hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
          envKeys: Object.keys(process.env).filter(key => key.includes('JWT'))
        }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to process login');
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as ITokenPayload;

      // Check if user exists and token is valid
      const user = await prisma.users.findUnique({
        where: { id: Number(decoded.id) },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }) as UserWithRoles | null;

      if (!user) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Check if user is active
      if (user.status !== user_status.active) {
        throw new AppError(403, 'Account is not active');
      }

      if(!user.roles){
        throw new AppError(500, 'User role not found');
      }

      // Get user permissions
      const permissions = user.roles?.role_permissions?.map(rp => rp.permissions.name) || [];
      
      // Generate new tokens
      const tokens = this.generateTokens({
        id: user.id.toString(),
        email: user.email,
        role: user.roles.name,
        status: user.status,
        permissions
      });

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid refresh token');
      }
      throw new AppError(500, 'Failed to refresh token');
    }
  }
}
