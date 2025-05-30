import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AppError } from './error.middleware';
import { ITokenPayload } from '../types/auth.types';
import { TokenBlacklistService } from '../services/auth/token-blacklist.service';
import { user_status } from '@prisma/client';
import { UserRole } from 'types/user.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        username: string;
        full_name: string;
        role_id: number;
        role: string;
        status: user_status;
        permissions: string[];
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication token missing'));
  }
  const token = authHeader.slice(7);

  try {
    if (await TokenBlacklistService.isBlacklisted(token)) {
      throw new AppError(401, 'Token has been invalidated');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as ITokenPayload;

    // Convert payload.id to number if it's a string
    const userId = typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id;

    const user = await prisma.users.findUnique({
      where: { id: userId },
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
    });

    if (!user) throw new AppError(401, 'User not found');
    if (user.status !== 'active') throw new AppError(403, 'User account is not active');

    const permissions = user.roles.role_permissions.map((rp: any) => rp.permissions.name);

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id,
      role: user.roles.name,
      status: user.status,
      permissions
    };

    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(new AppError(401, 'Token expired'));
    }
    if (err instanceof JsonWebTokenError) {
      return next(new AppError(401, 'Invalid token'));
    }
    if (err instanceof AppError) {
      return next(err);
    }
    return next(new AppError(500, 'Authentication failed'));
  }
};

export const hasRole = (roleName: UserRole | UserRole[]) => (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  const allowedRoles = Array.isArray(roleName) ? roleName : [roleName];
  console.log("user",req.user.role as UserRole);
  if (!allowedRoles.includes(req.user.role as UserRole)) {
    return next(new AppError(403, 'Forbidden: insufficient role'));
  }
  next();
};

export const hasPermission = (...perms: string[]) => (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  const ok = req.user.permissions.some(p => perms.includes(p));
  if (!ok) return next(new AppError(403, 'Forbidden: insufficient permissions'));
  next();
};