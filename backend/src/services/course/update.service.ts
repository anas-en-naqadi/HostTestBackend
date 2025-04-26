import prisma from "../../config/prisma";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, generateCacheKey, deleteFromCache } from "../../utils/cache.utils";
import { lesson_content_type } from "../../types/course.types";
export const updateCourse = async (courseSlug: string, courseData: Partial<CreateCourseDto>) => {
  try {
    const existingCourse = await prisma.courses.findUnique({ where: { slug: courseSlug } });
    if (!existingCourse) throw new AppError(404, "Course not found");

    const { modules, slug, ...courseDetails } = courseData;

    // Check if slug is being changed and if the new slug already exists
    if (slug && slug !== existingCourse.slug) {
      const slugTaken = await prisma.courses.findUnique({ where: { slug } });
      if (slugTaken) throw new AppError(400, "Course with this slug already exists.");
    }

    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Calculate total duration
      const totalDuration = modules?.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.duration, 0) || 0,
        0
      );

      // Update the course itself
      const updated = await tx.courses.update({
        where: { slug: courseSlug },
        data: {
          ...courseDetails,
          ...(totalDuration && { total_duration: totalDuration }),
          ...(slug && { slug }),
        },
      });

      // Update or create modules
      if (modules) {
        for (const module of modules) {
          console.log("module check",module)
      

          if (module.id) {
            const existingModule = await tx.modules.findUnique({ where: { id: module.id } });
            if (!existingModule) throw new AppError(404, "Module not found");
            // Update existing module
            await tx.modules.update({
              where: { id: module.id },
              data: {
                title: module.title,
                order_position: module.order_position,
                duration: module.lessons.reduce((sum, l) => sum + l.duration, 0) || 0,
              },
            });

            // Update or create lessons within the module
            for (const lesson of module.lessons) {
             

              if (lesson.id) {
                const existingLesson = await tx.lessons.findUnique({ where: { id: lesson.id } });
                if (!existingLesson) throw new AppError(404, "Lesson not found");
                // Update existing lesson
                await tx.lessons.update({
                  where: { id: lesson.id },
                  data: {
                    title: lesson.title,
                    content_type: lesson.content_type,
                    video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
                    lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
                    quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
                    duration: lesson.duration,
                    order_position: lesson.order_position,
                  },
                });
              } else {
                // Create new lesson
                await tx.lessons.create({
                  data: {
                    title: lesson.title,
                    content_type: lesson.content_type,
                    video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
                    lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
                    quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
                    duration: lesson.duration,
                    order_position: lesson.order_position,
                    module_id: existingModule.id,  // Associate lesson with the correct module
                  },
                });
              }
            }
          } else {
            // Create new module if it doesn't exist
            const createdModule = await tx.modules.create({
              data: {
                title: module.title,
                order_position: module.order_position,
                duration: module.lessons.reduce((sum, l) => sum + l.duration, 0) || 0,
                course_id: updated.id,
              },
            });

            // Create lessons for the new module
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
        }
      }

      return updated;
    });

    await clearCacheByPrefix(CACHE_KEYS.COURSES);
    await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseSlug}`));

    return updatedCourse;
  } catch (error) {
    console.error("Error updating course:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(500, "Error updating course.");
  }
};
