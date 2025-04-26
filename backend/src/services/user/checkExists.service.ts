import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service to check if a user exists by email or username
 * @param email User email
 * @param username User username
 * @param excludeId User ID to exclude from check (for updates)
 * @returns Promise with boolean indicating if user exists
 */
export const checkUserExists = async (
  email?: string, 
  username?: string, 
  excludeId?: number
): Promise<boolean> => {
  if (!email && !username) return false;

  const where: any = {
    OR: [],
  };

  if (email) where.OR.push({ email });
  if (username) where.OR.push({ username });
  if (excludeId) where.NOT = { id: excludeId };

  const existingUser = await prisma.users.findFirst({ where });
  return !!existingUser;
}; 