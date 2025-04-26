import { PrismaClient } from '@prisma/client';
import { UpdateRoleDto, RoleResponse } from '../../types/role.types';
import { clearCacheByPrefix, CACHE_KEYS } from '../../utils/cache.utils';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to update an existing role
 * @param id Role ID
 * @param dto Data to update
 * @returns Updated role data
 */
export const updateRole = async (
  id: number,
  dto: UpdateRoleDto
): Promise<RoleResponse> => {
  const exists = await prisma.roles.findUnique({ where: { id } });
  if (!exists) throw new AppError(404, 'Role not found');

  const updated = await prisma.roles.update({
    where: { id },
    data: dto,
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Clear cache by prefix to keep it fresh
  await clearCacheByPrefix(CACHE_KEYS.ROLES);
  return updated as RoleResponse;
};
