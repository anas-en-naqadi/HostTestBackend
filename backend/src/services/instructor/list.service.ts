import { PrismaClient } from '@prisma/client';
import { InstructorsResponse } from '../../types/instructor.types';
import { getFromCache, setInCache, CACHE_KEYS } from '../../utils/cache.utils';

const prisma = new PrismaClient();

/**
 * List all instructors with caching
 */
export const listInstructors = async (): Promise<InstructorsResponse[]> => {
  const key = CACHE_KEYS.INSTRUCTORS;
  const cached = await getFromCache<InstructorsResponse[]>(key);
  
  if (cached) {
    return cached;
  }
  
  // First, get all instructors
  const instructors = await prisma.instructors.findMany({
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
  
  // Transform the data to fit the `InstructorsResponse` format
  const transformedData = instructors.map(instructor => ({
    id: instructor.id,
    user_id: instructor.users?.id,
    full_name: instructor.users?.full_name,
    email: instructor.users?.email,
      description: instructor.description,
    specialization: instructor.specialization ,
  }));
  
  // Cache the transformed data
  await setInCache(key, transformedData);
  
  return transformedData as InstructorsResponse[];
};