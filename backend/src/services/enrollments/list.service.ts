// src/services/enrollments/list.service.ts
import redis from "../../config/redis";
import prisma from "../../config/prisma";
import { enrollments } from "@prisma/client";
const getEnrollmentsCacheKey = (userId: number, page: number, limit: number) =>
  `enrollments:${userId}:page${page}:limit${limit}`;

interface PaginatedEnrollments {
  enrollments: enrollments[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const getEnrollments = async (
  userId: number,
  page: number = 1,
  limit: number = 6
): Promise<PaginatedEnrollments> => {
  const cacheKey = getEnrollmentsCacheKey(userId, page, limit);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  // Calculate pagination parameters
  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const totalCount = await prisma.enrollments.count({
    where: { user_id: userId },
  });

  // Get paginated data
  const enrollments = await prisma.enrollments.findMany({
    where: { user_id: userId },
    orderBy:{
      enrolled_at:'desc'
    },
    include: {
      courses: {
        select: {
          subtitle: true,
          title: true,
          slug: true,
          thumbnail_url: true,
          modules: {
            include: {
              lessons: {
                include: {
                  lesson_progress: {
                    where: {
                      user_id: userId,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              full_name: true,
              instructors:true
            },
          },
        },
      },
    },
    skip: skip,
    take: limit,
  });

  const totalPages = Math.ceil(totalCount / limit);

  const result = {
    enrollments,
    totalCount,
    totalPages,
    currentPage: page,
  };

  await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
  await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
  return result;
};
