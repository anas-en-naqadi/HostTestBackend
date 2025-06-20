import prisma from "../../config/prisma";
import { CourseResponse } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import {
  CACHE_KEYS,
  generateCacheKey,
  getFromCache,
  setInCache,
} from "../../utils/cache.utils";

export const getCourseBySlug = async (slug: string, userId: number): Promise<any> => {
  const cacheKey = generateCacheKey(CACHE_KEYS.COURSE, `learn-${slug}-${userId}`);

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
      subtitle: true,
      course_requirements: true,
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
      wishlists: {
        where: {
          user_id: userId
        },
        select: {
          user_id: true,
        },
      },
      announcements: {
        select: {
          id: true,
          title: true,
          content: true,
          created_at: true,
        },
      },
      user: {
        select: {
          id: true,
          full_name: true,
          instructors: {
            select: {
              id: true,
              description: true,
              specialization: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true, // 🧮 Count of enrollments
        },
      },
      enrollments: {
        where: { user_id: userId },
        select: { id:true,user_id: true, last_accessed_lesson_id: true, last_accessed_module_id: true, progress_percent: true },
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
              duration: true,
              order_position: true,
              lesson_progress: {
                where: {
                  user_id: userId
                },
                select: {
                  user_id: true,
                  status: true,
                  completed_at: true
                }
              },
              notes: {
                where: { user_id: userId },
                select: {
                  id: true,
                  lesson_id:true,
                  created_at:true,
                  content: true,
                  noted_at: true,
                },
              },
              quizzes: {
                select: {
                  id: true,
                  title: true,
                  duration_time: true,
                  isFinal: true,
                  quiz_attempts: {
                    where: {
                      user_id: userId
                    },
                    select: {
                      passed: true,
                      score: true,
                      completed_at: true,
                      started_at: true,
                    }
                  },
                  questions: {
                    select: {
                      id: true,
                      text: true,
                      options: {
                        select: {
                          id: true,
                          text: true,
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
    throw new AppError(404, "Course not found");
  }

  if (Object.keys(course.enrollments).length === 0) {
    throw new AppError(400, "You must be enrolled to view this course");
  }
  const notes = course.modules.flatMap(module =>

    module.lessons.flatMap(lesson =>   lesson.notes.map(note => ({
      ...note,
      lesson_type: lesson.content_type,
      module_order_position:module.order_position,
      lesson_order_position:lesson.order_position,
      module_title:module.title,
      lesson_title:lesson.title,
    })))

  );


  await setInCache(cacheKey, { course, notes });

  return { course, notes };

};
