import { PrismaClient } from '@prisma/client';
import { UserResponse } from '../../types/user.types';
import { AppError } from '../../middleware/error.middleware';
import { CACHE_KEYS, deleteFromCache, clearCacheByPrefix } from '../../utils/cache.utils';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Service to update a user's profile
 * @param id User ID
 * @param data Update data including full_name, current_password, new_password, and password_confirmation
 * @returns Promise with updated user
 * @throws AppError if user not found or if password validation fails
 */
export const updateUserProfile = async (id: number, data: {
  full_name?: string;
  current_password?: string;
  new_password?: string;
  password_confirmation?: string;
}): Promise<UserResponse> => {
  // Find the user
  const user = await prisma.users.findUnique({
    where: { id },
    select: {
      id: true,
      full_name: true,
      username: true,
      email: true,
      password_hash: true,
      role_id: true,
      status: true,
      last_login: true,
      created_at: true,
      updated_at: true,
      roles: {
        select: {
          name: true
        }
      }
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Prepare update data
  const updateData: any = {};
  
  // Update full name if provided
  if (data.full_name) {
    updateData.full_name = data.full_name;
  }
  
  // Handle password update if provided
  if (data.new_password) {
    // Verify current password
    if (!data.current_password) {
      throw new AppError(400, 'Current password is required to update password');
    }
    
    // Check if current password is correct
    const isPasswordValid = await bcrypt.compare(data.current_password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(400, 'Current password is incorrect');
    }
    
    // Verify password confirmation
    if (data.new_password !== data.password_confirmation) {
      throw new AppError(400, 'New password and confirmation do not match');
    }
    
    // Hash the new password
    updateData.password_hash = await bcrypt.hash(data.new_password, SALT_ROUNDS);
  }

  // Set updated_at to current date
  const now = new Date();
  updateData.updated_at = now;
  
  // Update the user
  const updatedUser = await prisma.users.update({
    where: { id },
    data: updateData,
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
        select: {
          name: true
        }
      }
    },
  });

  // Invalidate both specific user cache and users list cache
  try {
    const userCacheKey = `${CACHE_KEYS.USER}:${id}`;
    await deleteFromCache(userCacheKey);
    await clearCacheByPrefix(CACHE_KEYS.USERS);
    console.log('Cache invalidated for user and users list after profile update');
  } catch (error) {
    console.error('Error invalidating cache:', error);
    // Continue execution even if cache invalidation fails
  }

  // Transform to match UserResponse interface
  const userResponse: UserResponse = {
    id: updatedUser.id,
    full_name: updatedUser.full_name,
    username: updatedUser.username,
    email: updatedUser.email,
    role: updatedUser.roles?.name || 'unknown',
    status: updatedUser.status,
    last_login: updatedUser.last_login,
    created_at: updatedUser.created_at,
    updated_at: updatedUser.updated_at
  };

  return userResponse;
}; 