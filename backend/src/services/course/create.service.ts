import prisma from "../../config/prisma";
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS } from "../../utils/cache.utils";
import { lesson_content_type } from "../../types/course.types";
import { sendNotification } from "../../utils/notification.utils";

export const createCourse = async (courseData: CreateCourseDto,userId:number) => {
  try {
    const { modules, ...courseDetails } = courseData;

    // Check if slug already exists (outside transaction to fail early)
    const existingCourse = await prisma.courses.findUnique({
      where: { slug: courseDetails.slug },
    });
    if (existingCourse) {
      throw new AppError(400, "Course with this slug already exists.");
    }

    // Run the creation in a single transaction
    const createdCourse = await prisma.$transaction(async (tx) => {
      // Calculate total duration
      const totalDuration = modules.reduce(
        (total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
        0
      );

      // Create the course
      const newCourse = await tx.courses.create({
        data: {
          ...courseDetails,
          total_duration: totalDuration * 60,
        },
      });

      // Create modules and their lessons
      for (const module of modules) {
        const duration = module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

        const createdModule = await tx.modules.create({
          data: {
            title: module.title,
            order_position: module.order_position,
            duration,
            course_id: newCourse.id,
          },
        });

        // Create lessons
        for (const lesson of module.lessons) {
          await tx.lessons.create({
            data: {
              title: lesson.title,
              content_type: lesson.content_type,
              video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
              lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
              quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
              duration: lesson.duration,
              order_position: lesson.order_position,
              module_id: createdModule.id,
            },
          });
        }
      }

      return newCourse;
    });

    console.log("created_course",createCourse);
    // Clear cache after successful commit
    await clearCacheByPrefix(CACHE_KEYS.COURSES);
    await sendNotification( {
      title:   'New Course Available',
      user_id:createdCourse.instructor_id,
      type:    'NEW_COURSE',
      content: `A new course <b>${createdCourse.title}</b> is now open for enrollment!`,
      metadata: { slug: createdCourse.slug,thumbnail_url:createdCourse.thumbnail_url },
    },userId,"instructor");
    return createdCourse;
  } catch (error) {
    console.error("Error creating course:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, "Error creating course.");
  }
};
