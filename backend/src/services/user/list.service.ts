import { PrismaClient } from '@prisma/client';
import { UserResponse, UserRole } from '../../types/user.types';

const prisma = new PrismaClient();

/**
 * Service to get all users
 * @returns Promise with array of users
 */
export const listUsers = async (userId:number): Promise<UserResponse[]> => {


  // If not in cache, get from database
  const users = await prisma.users.findMany({
  orderBy: { created_at: 'desc' },
  include: {
    roles:       { select: { name: true } },
     instructors: {  // Fetch the `instructor` relation
        select: {
          id: true,
          description: true,
          specialization: true,
        },
      },
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
    updated_at: user.updated_at,
 instructor:user.instructors
   }));

  return userResponses.filter((u) => u.id !== userId);
}; 