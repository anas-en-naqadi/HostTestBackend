// src/services/wishlists/list.service.ts
import { PrismaClient, wishlists } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getWishlistsCacheKey = (userId: number, page: number, limit: number) => 
  `wishlists:${userId}:page${page}:limit${limit}`;

interface PaginatedWishlists {
  wishlists: wishlists[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const getWishlists = async (
  userId: number, 
  page: number = 1, 
  limit: number = 6
): Promise<PaginatedWishlists> => {
  const cacheKey = getWishlistsCacheKey(userId, page, limit);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  // Calculate pagination parameters
  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const totalCount = await prisma.wishlists.count({
    where: { user_id: userId }
  });

  // Get paginated data
  const wishlists = await prisma.wishlists.findMany({
    where: { user_id: userId },
    include: { 
      courses: {
        include: {
          user: {
            select: {
                  full_name: true
            }
          },
          enrollments: {
            where: {
              user_id: userId
            },
            select: {
              id: true
            }
          }
        }
      }
    },
    skip: skip,
    take: limit
  });

   // Transform data to include isEnrolled flag
   const transformedWishlists = wishlists.map(item => {
    // Check if user is enrolled in this course
    const isEnrolled = item.courses.enrollments && item.courses.enrollments.length > 0;
    
    return {
      ...item,
      courses: {
        ...item.courses,
        isEnrolled: isEnrolled
      }
    };
  });

  const totalPages = Math.ceil(totalCount / limit);
  
  const result = {
    wishlists: transformedWishlists,
    totalCount,
    totalPages,
    currentPage: page
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
  return result;
};