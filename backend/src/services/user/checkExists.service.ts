import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to check if a user exists by email or username
 * @param email User email
 * @param username User username
 * @param excludeId User ID to exclude from check (for updates)
 * @throws AppError with 409 status if user exists
 */
export const checkUserExists = async (
  email?: string, 
  username?: string, 
  excludeId?: number
): Promise<void> => {
  if (!email && !username) return;

  // First check email if provided
  if (email) {
    const whereEmail: any = { email };
    if (excludeId) whereEmail.NOT = { id: excludeId };

    const existingUserWithEmail = await prisma.users.findFirst({ 
      where: whereEmail,
      select: { id: true } // Only select what we need
    });
    
    if (existingUserWithEmail) {
      throw new AppError(409, 'User with this email already exists');
    }
  }

  // Then check username if provided
  if (username) {
    const whereUsername: any = { username };
    if (excludeId) whereUsername.NOT = { id: excludeId };

    const existingUserWithUsername = await prisma.users.findFirst({ 
      where: whereUsername,
      select: { id: true } // Only select what we need
    });
    
    if (existingUserWithUsername) {
      throw new AppError(409, 'User with this username already exists');
    }
  }
};