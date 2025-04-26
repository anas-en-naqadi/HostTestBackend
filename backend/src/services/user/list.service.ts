import { PrismaClient } from '@prisma/client';
import { UserResponse, UserRole } from '../../types/user.types';
import { CACHE_KEYS, getFromCache, setInCache } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * Service to get all users
 * @returns Promise with array of users
 */
export const listUsers = async (): Promise<UserResponse[]> => {
  // Try to get from cache first
  const cachedUsers = await getFromCache<UserResponse[]>(CACHE_KEYS.USERS);
  if (cachedUsers) {
    return cachedUsers;
  }

  // If not in cache, get from database
  const users = await prisma.users.findMany({
    orderBy: { created_at: 'desc' },
    where:{
      roles:{
        name:{
          not:UserRole.INSTRUCTOR,
        }
      }
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
        select: {
          name: true
        }
      }
    },
  });

  // Transform the response to match UserResponse interface
  const userResponses: UserResponse[] = users.map(user => ({
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    role: user.roles?.name || 'unknown',
    status: user.status,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at
  }));

  // Store in cache
  await setInCache(CACHE_KEYS.USERS, userResponses);

  return userResponses;
}; 