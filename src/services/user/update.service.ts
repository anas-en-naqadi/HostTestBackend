import { PrismaClient } from '@prisma/client';
import { UserBody, UserResponse, UserStatus } from '../../types/user.types';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Update a user's information including possible instructor details
 * @param userId The ID of the user to update
 * @param userData The data to update for the user
 * @returns The updated user data
 */
export const updateUser = async (userId: number, userData: UserBody): Promise<UserResponse> => {
  // Verify user exists
  const userExists = await prisma.users.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      instructors: true
    }
  });  

  if (!userExists) {
    throw new AppError(404, 'User not found');
  }

  // Convert status boolean to enum string value
  const statusValue = userData.status === true ? UserStatus.ACTIVE : UserStatus.INACTIVE;

  // Get role ID if role name is provided
  let roleId:number ;
  if (userData.role) {
    const role = await prisma.roles.findFirst({
      where: { name: userData.role }
    });

    if (!role) {
      throw new AppError(400, `Role '${userData.role}' not found`);
    }
    
    roleId = role.id;
  }

  // Begin transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the base user information
    const updatedUser = await tx.users.update({
      where: { id: userId },
      data: {
        full_name: userData.full_name,
        role_id: roleId,
        status: statusValue,
        updated_at: new Date()
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
        instructors:{
            select:{
                id:true,
                specialization:true,
                description:true,
            }
        },
        roles: {
          select: { name: true }
        }
      },
    });

    // Handle instructor-specific updates if applicable
    const isNotIntern = updatedUser.roles?.name !== 'intern';
    const wasNotIntern = userExists.roles?.name !== 'intern';

    if (isNotIntern) {
      if (!wasNotIntern) {
        // User was not previously an instructor, create instructor record
        await tx.instructors.create({
          data: {
            user_id: userId,
            description: userData.description || null,
            specialization: userData.specialization || null,
          },
        });
      } else {
        // User was already an instructor, update instructor record
        await tx.instructors.update({
          where: { user_id: userId },
          data: {
            description: userData.description,
            specialization: userData.specialization,
          },
        });
      }
    } else if (wasNotIntern && !isNotIntern) {
      // User was previously an instructor but is no longer, delete instructor record
      await tx.instructors.delete({
        where: { user_id: userId },
      });
    }

    return updatedUser;
  });


  // Format response object
  const userResponse: UserResponse = {
    id: result.id,
    full_name: result.full_name,
    username: result.username,
    email: result.email,
    role: result.roles?.name || 'unknown',
    status: result.status,
    last_login: result.last_login,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };

  // If user is an instructor, fetch the instructor details to include in response
  if (result.roles?.name === 'instructor') {
    const instructorDetails = await prisma.instructors.findUnique({
      where: { user_id: result.id },
    });
    
    if (instructorDetails) {
     userResponse.instructor = {
        description:    instructorDetails.description   || undefined,
        specialization: instructorDetails.specialization || undefined,
      };
    }
  }

  return userResponse;
};

