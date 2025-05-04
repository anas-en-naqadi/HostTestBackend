import prisma from "../../config/prisma";
import { CourseResponse } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export const getCourseBySlugAC = async ({slug,userId}:{slug:string,userId:number}): Promise<any> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `detail-${slug}`);

  // Check cache
  const cached = await getFromCache<CourseResponse>(cacheKey);
  if (cached) return cached;


  const course = await prisma.courses.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      subtitle: true,
      description: true,
      total_duration: true,
      difficulty: true,
      created_at: true,
      intro_video_url: true,
      what_you_will_learn: true,
      course_requirements: true,
      wishlists:{
        where:{
          user_id:userId
        },
        select: {
          user_id: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
  
      instructors: {
        select: {
          id: true,
          description: true,
          specialization: true,
          users: {
            select: {
              id: true,
              full_name: true,
            },
          },
          courses: {
            orderBy:{
              created_at:"desc"
            },
            select: {
              id: true,
              title: true,
              thumbnail_url: true,
              total_duration: true,
              difficulty: true,
              instructors: {
                select: {
                  users: {
                    select: {
                      full_name: true,
                    },
                  },
                },
              },
              wishlists: {
                where: {
                  user_id: userId, // ✅ Use the current user's ID here
                },
                select: {
                  user_id: true,
                },
              },
            },
          },
        },
      },
  
      _count: {
        select: {
          enrollments: true,
        },
      },
      enrollments:{
        where:{
          user_id:userId
        },
        select:{
          user_id:true
        }
      },
  
      modules: {
        orderBy: { order_position: 'asc' },
        select: {
          id: true,
          title: true,
          duration: true,
          order_position:true,
          lessons: {
            orderBy: { order_position: 'asc' },
            select: {
              id: true,
              title: true,
              content_type: true,
              duration: true,
              order_position: true,
            },
          },
        },
      },
    },
  });

 

    if (!course) {
        throw new AppError(404, 'Course Not Found');
    }

    await setInCache(cacheKey, course);

    return course;

};
