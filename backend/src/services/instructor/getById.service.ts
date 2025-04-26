import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { InstructorsResponse } from '../../types/instructor.types';

const prisma = new PrismaClient();

export const getInstructorById = async (id: number): Promise<InstructorsResponse> => {
  const instructor = await prisma.instructors.findUnique({
    where: { id },
    select: {
      id: true,
      description: true,
      specialization: true,
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
        }
      }
    }
  });
  if (!instructor) throw new AppError(404, 'Instructor not found');
  const transformedData = {
    id: instructor.id,
    user_id: instructor.users?.id,
    full_name: instructor.users?.full_name,
    email: instructor.users?.email,
      description: instructor.description,
    specialization: instructor.specialization ,
  };
  
  return transformedData as InstructorsResponse;
};