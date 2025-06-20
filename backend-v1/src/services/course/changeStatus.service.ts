// src/services/course/changeStatus.service.ts
import prisma from '../../config/prisma';
import { generateCacheKey,CACHE_KEYS,deleteFromCache } from '../../utils/cache.utils';

export const changeCourseStatusService = async (courseId: number, isPublished: boolean, userId: number, role: string): Promise<void> => {
  const course = await prisma.courses.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found.');
  }

    const cacheKey = generateCacheKey(CACHE_KEYS.COURSES, `user-${userId}-${role}`);

  await prisma.courses.update({
    where: { id: courseId },
    data: { is_published: isPublished },
  });

  await deleteFromCache(cacheKey)
};
