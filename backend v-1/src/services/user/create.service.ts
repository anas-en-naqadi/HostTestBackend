import { PrismaClient } from '@prisma/client';
import { UserResponse, UserStatus } from '../../types/user.types';
import { AppError } from '../../middleware/error.middleware';
import { checkUserExists } from './checkExists.service';
import bcrypt from 'bcrypt';
import { CreateUserInput } from '../../validation/user.validation';
import { EmailVerificationService } from '../../services/auth/email-verification.service';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const createUser = async (data: CreateUserInput): Promise<UserResponse> => {
  // Validate unique constraints before proceeding
  await checkUserExists(data.email, data.username);

  const { role, description, specialization, ...sanitizedData } = data;
  const now = new Date();
  
  // Find role
  const roleRow = await prisma.roles.findFirst({
    where: { name: role }
  });

  if (!roleRow) {
    throw new AppError(404, 'Role not found');
  }
  
  // Generate secure random password - cryptographically safer approach
  // Generate 15 random bytes and convert to base64, then trim
  const tempPassword = randomBytes(15)
    .toString('base64')
    .replace(/[+/=]/g, '') // Remove non-URL safe chars
    .slice(0, 10); // Take first 10 chars
    
  const tempPasswordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  
  // Determine user status
  const statusValue = data.status === true ? UserStatus.ACTIVE : UserStatus.INACTIVE;

  try {
    // Begin transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          ...sanitizedData,
          password_hash: tempPasswordHash,
          created_at: now,
          role_id: roleRow.id,
          status: statusValue,
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

      // Create instructor record if applicable
      if (roleRow.name !== 'intern') {
        await tx.instructors.create({
          data: { 
            user_id: user.id, 
            specialization: specialization || null, 
            description: description || null 
          },
        });
      }

      return user;
    });

    // Send verification email with temporary password
    try {
      await EmailVerificationService.sendVerificationEmailWithPassword(result.id, tempPassword);
    } catch (error) {
      console.error('Failed to send verification email with password:', error);
      // Continue with user creation even if email fails
    }

    // Format response
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
  } catch (error:any) {
    // Handle database-specific errors
    if (error.code === 'P2002') {
      throw new AppError(409, 'User with these credentials already exists');
    }
    throw error;
  }
};