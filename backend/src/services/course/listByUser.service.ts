import prisma from "../../config/prisma";
import { getFromCache, setInCache, generateCacheKey, CACHE_KEYS } from "../../utils/cache.utils";

interface CoursesResponse {
  courses: {
    id: number;
    title: string;
    slug: string;
    thumbnail_url: string;
    difficulty: string;
    total_duration: number;
    is_published: boolean | null;
    created_at: Date | null;
    instructor_id: number;
    user: {
      id: number;
      full_name: string;
    };
    categorieName: string;
    enrollmentsCount: number;
  }[];
}

export const listCoursesByUserId = async (
  userId: number,
  role: string
): Promise<CoursesResponse> => {
  try {
    // Generate a unique cache key based on user and role
    const cacheKey = generateCacheKey(CACHE_KEYS.COURSES, `user-${userId}-${role}`);
    
    // Try to get data from cache first
    const cachedData = await getFromCache<CoursesResponse>(cacheKey);
    if (cachedData) {
      console.log(`Retrieved courses for user ${userId} with role ${role} from cache`);
      return cachedData;
    }
    
    // If not in cache, proceed with database query

    const whereConditions: any = {}
    if(role === "instructor") {
      whereConditions.instructor_id = userId
    }
    // Fetch courses with all fields needed for the edit form
    const courses = await prisma.courses.findMany({
      where: whereConditions,
      orderBy: [
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        slug: true,
        thumbnail_url: true,
        difficulty: true,
        total_duration: true,
        is_published: true,
        created_at: true,
        instructor_id: true,
        category_id: true,
        intro_video_url: true,
        what_you_will_learn: true,
        course_requirements: true,
        user: {
          select: {
            id: true,
            full_name: true
          }
        },
        categories: { 
          select: { 
            id: true,
            name: true 
          } 
        },
        _count: { select: { enrollments: true } },
        wishlists: {
          where: { user_id: userId },
          take: 1
        },
        modules: {
          select: {
            id: true,
            title: true,
            duration: true,
            order_position: true,
            lessons: {
              select: {
                id: true,
                title: true,
                content_type: true,
                video_url: true,
                lesson_text: true,
                quiz_id: true,
                duration: true,
                order_position: true,
                quizzes: {
                  select: {
                    id: true,
                    title: true,
                    isFinal: true
                  }
                }
              },
              orderBy: {
                order_position: 'asc'
              }
            }
          },
          orderBy: {
            order_position: 'asc'
          }
        }
      }
    });

    const formatted = courses.map(course => ({
      // Basic course details
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      slug: course.slug,
      thumbnail_url: course.thumbnail_url,
      difficulty: course.difficulty,
      total_duration: course.total_duration,
      is_published: course.is_published,
      created_at: course.created_at,
      instructor_id: course.instructor_id,
      category_id: course.category_id,
      
      // Additional course details for the form
      intro_video_url: course.intro_video_url,
      what_you_will_learn: course.what_you_will_learn,
      course_requirements: course.course_requirements,
      
      // Related data
      user: course.user,
      categories: course.categories,
      categorieName: course.categories?.name || '',  // Provide empty string as fallback to avoid undefined
      enrollmentsCount: course._count.enrollments,
      
      // Modules and lessons
      modules: course.modules
    }));

    const result = {
      courses: formatted
    };
    
    // Store result in cache (30 minutes TTL for user-specific data)
    await setInCache(cacheKey, result, 1800);
    
    return result;
  } catch (error) {
    console.error("Error fetching courses by user ID:", error);
    throw new Error("Failed to load user courses.");
  }
};
