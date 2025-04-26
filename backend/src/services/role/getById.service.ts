import { PrismaClient } from '@prisma/client';
import { RoleResponse } from '../../types/role.types';
import { AppError } from '../../middleware/error.middleware';
import { CACHE_KEYS, generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Service to get a role by its ID
 * @param id Role ID
 * @returns Role data
 * @throws AppError if role not found
 */
export const getRoleById = async (id: number): Promise<RoleResponse> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.ROLES, id);

  // Try to get the role from cache first
  const cached = await getFromCache<RoleResponse>(cacheKey);
  if (cached) return cached;

  // If not found in cache, fetch from database
  const role = await prisma.roles.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      role_permissions: {
        select: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw new AppError(404, 'Role not found');
  }

  const roleResponse: RoleResponse = {
    id: role.id,
    name: role.name,
    description: role.description || undefined,
    permissions: role.role_permissions.map((permission) => permission.permissions),
  };

  // Save to cache
  await setInCache(cacheKey, roleResponse);

  return roleResponse;
};
