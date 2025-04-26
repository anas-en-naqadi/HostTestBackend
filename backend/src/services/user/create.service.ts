import { PrismaClient } from '@prisma/client';
import { UserResponse, UserStatus } from '../../types/user.types';
import { AppError } from '../../middleware/error.middleware';
import { checkUserExists } from './checkExists.service';
import { CACHE_KEYS, clearCacheByPrefix } from '../../utils/cache.utils';
import bcrypt from 'bcrypt';
import { CreateUserInput } from '../../validation/user.validation';
import { EmailVerificationService } from '../../services/auth/email-verification.service';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const createUser = async (data: CreateUserInput): Promise<UserResponse> => {
  const userExists = await checkUserExists(data.email, data.username);

  if (userExists) {
    throw new AppError(409, 'User with this email or username already exists');
  }

  const now = new Date();

  const role = await prisma.roles.findFirst({
    where: { id: data.role_id }
  });

  if (!role) {
    throw new AppError(500, 'Role not found');
  }
const pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@';
  const tempPassword = [...randomBytes(10)]
    .map(b => pattern[b % 63])
    .join('');

  const tempPasswordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  // Begin transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        ...data,
        password_hash: tempPasswordHash,
        created_at: now,
        role_id: role.id,
        status: UserStatus.INACTIVE,
      },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        role_id: true,
        status: true,
        last_login: true,
        created_at: true,
        updated_at: true,
        roles: {
          select: { name: true }
        }
      },
    });

    if (role.name === 'instructor') {
      await tx.instructors.create({
        data: { user_id: user.id },
      });
    }

    return user;
  });

  await EmailVerificationService.sendVerificationEmail(result.id);


    await clearCacheByPrefix(CACHE_KEYS.USERS);


  const userResponse: UserResponse = {
    id: result.id,
    full_name: result.full_name,
    username: result.username,
    email: result.email,
    role: result.roles?.name || 'unknown',
    status: result.status,
    last_login: result.last_login,
    created_at: result.created_at,
    updated_at: result.updated_at
  };

  return userResponse;
};
