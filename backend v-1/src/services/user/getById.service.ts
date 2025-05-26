import { PrismaClient } from '@prisma/client';
import { UserResponse } from '../../types/user.types';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Service to get a user by ID
 * @param id User ID
 * @returns Promise with user data
 * @throws AppError if user not found
 */
export const getUserById = async (id: number): Promise<UserResponse> => {

  // If not in cache, get from database
  const user = await prisma.users.findUnique({
    where: { id },
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
          name: true,
        },
      },
      instructors: {  // Fetch the `instructor` relation
        select: {
          id: true,
          description: true,
          specialization: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Determine if the user has the 'instructor' role
  const isNotIntern = user.roles?.name !== 'intern';

  // Transform the response to match UserResponse interface
  const userResponse: UserResponse = {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    email: user.email,
    role: user.roles?.name || 'unknown', // Default to 'unknown' if no role found
    status: user.status,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at,
    ...(isNotIntern && { instructor: user.instructors }), // Only include instructors data if role is 'instructor'
  };



  return userResponse;
};
