// src/services/dashboard/courseSuggestions.service.ts
import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';
import { PopularCourse } from '../../types/dashboard.types';

const prisma = new PrismaClient();

const getPopularCoursesCacheKey = (instructorId: number, limit: number) =>
  `dashboard:popular_courses:instructor:${instructorId}:limit:${limit}`;

export const getInstructorPopularCourses = async (
  instructorId: number,
  limit: number = 4
): Promise<PopularCourse[]> => {
  const cacheKey = getPopularCoursesCacheKey(instructorId, limit);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const popularCourses = await prisma.courses.findMany({
    where: {
      is_published: true,
      instructor_id: instructorId
    },
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      _count: {
        select: {
          enrollments: true
        }
      }
    },
    orderBy: {
      enrollments: {
        _count: 'desc'
      }
    },
    take: limit
  });

  const formattedCourses: PopularCourse[] = popularCourses.map(course => ({
    id: course.id.toString(),
    thumbnail: course.thumbnail_url,
    title: course.title,
    participants: course._count.enrollments
  }));

  // Cache the result for 6 hours
  await redis.set(cacheKey, JSON.stringify(formattedCourses), 'EX', 21600);

  return formattedCourses;
};
