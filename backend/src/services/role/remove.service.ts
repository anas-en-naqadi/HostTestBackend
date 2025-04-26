import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { clearCacheByPrefix, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Service to remove a role by its ID
 * @param id Role ID
 * @returns Success message
 */
export const removeRole = async (id: number): Promise<void> => {
  const role = await prisma.roles.findUnique({ where: { id } });
  if (!role) throw new AppError(404, 'Role not found');

  await prisma.roles.delete({
    where: { id },
  });

  // Clear cache by prefix to keep it fresh
  await clearCacheByPrefix(CACHE_KEYS.ROLES);
};
