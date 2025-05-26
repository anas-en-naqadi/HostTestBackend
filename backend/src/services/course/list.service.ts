import prisma from "../../config/prisma";
import { CourseResponse } from "../../types/course.types";

interface PaginatedCourses {
  courses: CourseResponse[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

interface CourseFilters {
  query?: string | null;
  durations?: string[] | null;
  topics?: string[] | null;
  levels?: string[] | null;
}

const parseDurationFilter = (durationStr: string): { min: number; max: number | null } => {
  const cleanedStr = decodeURIComponent(durationStr.replace(/\+/g, ' '));
  if (cleanedStr === '0 - 1 Hour') return { min: 0, max: 3600 };
  if (cleanedStr === '1 - 3 Hours') return { min: 3600, max: 10800 };
  if (cleanedStr === '3 - 6 Hours') return { min: 10800, max: 21600 };
  if (cleanedStr === '6 - 17 Hours') return { min: 21600, max: 61200 };
  if (cleanedStr === '17+ Hours') return { min: 61200, max: null };
  return { min: 0, max: null };
};

export const listAllCourses = async (
  page = 1,
  limit = 6,
  filters?: CourseFilters,
  userId?: number
): Promise<PaginatedCourses> => {
  try {
    const whereConditions: any = { is_published: true };
    const andConditions = [];

    // Process search query
    if (filters?.query) {
      const searchQuery = filters.query.toLowerCase();
      andConditions.push({
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { subtitle: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          {
            user: {
            
                full_name: { contains: searchQuery, mode: 'insensitive' }
              
            }
          },
          {
            categories: {
              name: { contains: searchQuery, mode: 'insensitive' }
            }
          }
        ]
      });
    }

    // Process duration filters
    if (filters?.durations?.length) {
      andConditions.push({
        OR: filters.durations.map(duration => {
          const { min, max } = parseDurationFilter(duration);
          return max === null
            ? { total_duration: { gte: min } }
            : { total_duration: { gte: min, lt: max } };
        })
      });
    }

    // Process topic filters
    if (filters?.topics?.length) {
      andConditions.push({
        categories: { name: { in: filters.topics } }
      });
    }

    // Process level filters
    if (filters?.levels?.length) {
      andConditions.push({
        difficulty: { in: filters.levels }
      });
    }

    // Combine all conditions with AND
    if (andConditions.length > 0) {
      whereConditions.AND = andConditions;
    }

    // Get total count
    const totalCount = await prisma.courses.count({ where: whereConditions });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch courses with wishlist status
    const courses = await prisma.courses.findMany({
      where: whereConditions,
      orderBy: [
        { enrollments: { _count: 'desc' } },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail_url: true,
        difficulty: true,
        total_duration: true,
        is_published: true,
        subtitle: true,
        created_at: true,
        user: {
          select: {
            id:true,
            full_name: true,
            instructors:{
           select:{
             id: true,
            specialization: true,
           }
            }
          }
        },
        categories: { select: { name: true } },
        _count: { select: { enrollments: true } },
        wishlists: userId
          ? {
              select: { created_at: true }, // Select minimal field to check existence
              where: { user_id: userId },
              take: 1
            }
          : undefined
      },
      skip,
      take: limit,
    });

    // Map courses to include isInWishList
    const coursesWithWishlistStatus = courses.map((course) => ({
      ...course,
      isInWishList: userId ? !!course.wishlists?.length : false,
      wishlists: undefined // Remove wishlists field from response
    }));

    return {
      courses: coursesWithWishlistStatus as CourseResponse[],
      pagination: { totalCount, totalPages, currentPage: page, limit },
    };
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw new Error("Failed to load courses.");
  }
};