import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';
import { UpdateInstructorDto, InstructorResponse } from '../../types/instructor.types';
import { clearCacheByPrefix, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

export const updateInstructor = async (
  id: number,
  dto: UpdateInstructorDto
): Promise<InstructorResponse> => {
  const exists = await prisma.instructors.findUnique({ where: { id } });
  if (!exists) throw new AppError(404, 'Instructor not found');

  const updated = await prisma.instructors.update({
    where: { id },
    data: dto,
    select: { id: true, user_id: true, specialization: true, description: true },
  });

  await clearCacheByPrefix(CACHE_KEYS.INSTRUCTORS);
  return updated as InstructorResponse;
};