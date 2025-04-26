import prisma from "../../config/prisma";
import { CourseResponse } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export const getCourseBySlug = async (slug: string): Promise<any> => {
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
        thumbnail_url: true,
        is_published: true,
        description: true,
        total_duration: true,
        difficulty: true,
        created_at: true,
        intro_video_url: true,
        what_you_will_learn: true,
        subtitle :true,
        course_requirements: true,  
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        announcements: {
          select: {
            id: true,
            title: true,
            content: true,
            created_at:true,
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
          },
        },
        _count: {
          select: {
            enrollments: true, // 🧮 Count of enrollments
          },
        },
        modules: {
          select: {
            id: true,
            title: true,
            duration: true,
            order_position:true,
            lessons: {
              select: {
                id: true,
                title: true,
                content_type: true,
                video_url: true,
                lesson_text: true,
                duration: true,
                order_position: true,
                notes: {
                  select: {
                    id: true,
                    content: true,
                    noted_at:true,
                  },
                },
                quizzes: {
                  select: {
                    id: true,
                    title: true,
                    questions: {
                      select: {
                        id: true,
                        text: true,
                        options: {
                          select: {
                            id: true,
                            text: true,
                            is_correct: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: {
                order_position: 'asc',
              },
            },
          },
          orderBy: {
            order_position: 'asc',
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
