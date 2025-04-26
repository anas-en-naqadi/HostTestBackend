import { PrismaClient } from '@prisma/client';
import { RoleResponse } from '../../types/role.types';
import { CACHE_KEYS, generateCacheKey, getFromCache, setInCache } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Service to get a list of all roles with caching
 * @returns List of roles
 */
export const getRolesList = async (): Promise<RoleResponse[]> => {
  // Generate a cache key based on the roles list
  const cacheKey = generateCacheKey(CACHE_KEYS.ROLES, 'list');

  // Try to get the roles from the cache
  const cachedRoles = await getFromCache<RoleResponse[]>(cacheKey);
  if (cachedRoles) {
    return cachedRoles;
  }

  // If not found in cache, get the roles from the database
  const roles = await prisma.roles.findMany({
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

  // Store the roles in the cache with a TTL (Time to Live) if needed
  await setInCache(cacheKey, roles);
  const roleResponse: RoleResponse[] =roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description || undefined,
    permissions: role.role_permissions.map((permission) => permission.permissions),
  }));
  return roleResponse;
};
