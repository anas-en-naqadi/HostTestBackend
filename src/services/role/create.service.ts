import { PrismaClient } from '@prisma/client';
import { CreateRoleDto, RoleResponse } from '../../types/role.types';
import { clearCacheByPrefix, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Service to create a new role
 * @param roleData Role data
 * @returns Created role data
 */
export const createRole = async (roleData: CreateRoleDto): Promise<RoleResponse> => {
  const newRole = await prisma.roles.create({
    data: roleData,
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  // Clear cache by prefix to keep it fresh
  await clearCacheByPrefix(CACHE_KEYS.ROLES);
  return newRole as RoleResponse;
};
