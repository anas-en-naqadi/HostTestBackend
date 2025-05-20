import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

const prisma = new PrismaClient();


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
  
}; 