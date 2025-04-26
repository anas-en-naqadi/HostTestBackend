import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { CACHE_KEYS, generateCacheKey, clearCacheByPrefix, deleteFromCache } from '../../utils/cache.utils';
import { UserRole } from '../../types/user.types';

const prisma = new PrismaClient();

/**
 * Service to delete a user
 * @param id User ID
 * @throws AppError if user not found
 */
export const removeUser = async (id: number): Promise<void> => {
  // Check if user exists
  const user = await prisma.users.findUnique({
    where: { id },
    include:{
      roles:true,
      instructors:true
    }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  await prisma.$transaction(async (tx) => {
    // Remove any courses taught by this user (cascades modules/lessons)
    if(user.instructors){
    await tx.courses.deleteMany({
      where: { instructor_id: user.instructors.id },
    });
      // Remove the instructor row itself (if present)
      await tx.instructors.deleteMany({
        where: { user_id: id },
      });
  }

  

    // Finally delete the user
    await tx.users.delete({
      where: { id },
    });
  });
  // Invalidate caches
  try {
    // Delete the specific user cache
    await deleteFromCache(generateCacheKey(CACHE_KEYS.USER, id));
    
    // Clear the users list cache
    await clearCacheByPrefix(CACHE_KEYS.USERS);
    
    console.log(`Cache invalidated for user ${id} and users list`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    // Continue execution even if cache invalidation fails
  }
}; 