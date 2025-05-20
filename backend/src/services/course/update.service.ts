import prisma from "../../config/prisma";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, generateCacheKey, deleteFromCache } from "../../utils/cache.utils";
import { formatThumbnailUrl } from "../../utils/url.utils";
import { lesson_content_type } from "../../types/course.types";
export const updateCourse = async (courseSlug: string, courseData: Partial<CreateCourseDto>) => {
  try {
    const existingCourse = await prisma.courses.findUnique({ where: { slug: courseSlug } });
    if (!existingCourse) throw new AppError(404, "Course not found");

    // Extract data from courseData, treating it as a Record to access unknown properties
    const courseDataRecord = courseData as Record<string, any>;
    const { modules, slug, ...courseDetailsRaw } = courseDataRecord;
    
    // Process course details to ensure correct types and align with Prisma schema
    const processedDetails: Record<string, any> = {};
    
    // Handle basic fields that match the schema
    const allowedCourseFields = [
      'title', 'subtitle', 'description', 'difficulty', 'is_published', 
      'intro_video_url', 'total_duration'
    ];
    
    // Only include fields that are in the Prisma schema
    for (const key of Object.keys(courseDetailsRaw)) {
      if (allowedCourseFields.includes(key)) {
        processedDetails[key] = courseDetailsRaw[key];
      }
    }
    
    // Handle special cases and conversions for relational fields
    if ('category_id' in courseDetailsRaw) {
      const categoryId = typeof courseDetailsRaw.category_id === 'string'
        ? parseInt(courseDetailsRaw.category_id, 10)
        : courseDetailsRaw.category_id;
      
      // Connect to the category using the Prisma relation format
      processedDetails.categories = {
        connect: { id: categoryId }
      };
      
      // Remove the raw field as we're using the relation format
      delete processedDetails.category_id;
    }
    
    if ('instructor_id' in courseDetailsRaw) {
      const instructorId = typeof courseDetailsRaw.instructor_id === 'string'
        ? parseInt(courseDetailsRaw.instructor_id, 10)
        : courseDetailsRaw.instructor_id;
      
      // Connect to the user using the Prisma relation format
      processedDetails.user = {
        connect: { id: instructorId }
      };
      
      // Remove the raw field as we're using the relation format
      delete processedDetails.instructor_id;
    }
    
    // Handle boolean fields
    if ('is_published' in courseDetailsRaw) {
      processedDetails.is_published = typeof courseDetailsRaw.is_published === 'string'
        ? courseDetailsRaw.is_published === 'true'
        : !!courseDetailsRaw.is_published;
    }
    
    // Handle JSON fields
    if ('what_you_will_learn' in courseDetailsRaw) {
      processedDetails.what_you_will_learn = typeof courseDetailsRaw.what_you_will_learn === 'string'
        ? JSON.parse(courseDetailsRaw.what_you_will_learn)
        : courseDetailsRaw.what_you_will_learn;
    }
    
    if ('course_requirements' in courseDetailsRaw) {
      processedDetails.course_requirements = typeof courseDetailsRaw.course_requirements === 'string'
        ? JSON.parse(courseDetailsRaw.course_requirements)
        : courseDetailsRaw.course_requirements;
    }
    
    // Handle file uploads - check for thumbnail in courseDataRecord directly
    if ('thumbnail' in courseDataRecord && typeof courseDataRecord.thumbnail === 'string') {
      // Use our utility function to ensure consistent URL formatting
      processedDetails.thumbnail_url = formatThumbnailUrl(courseDataRecord.thumbnail);
    } else if ('thumbnail_url' in courseDataRecord && typeof courseDataRecord.thumbnail_url === 'string') {
      // If thumbnail_url is provided directly in the JSON data, use it
      processedDetails.thumbnail_url = courseDataRecord.thumbnail_url;
    }
    
    // Final processed course details
    const courseDetails = processedDetails;

    // Check if slug is being changed and if the new slug already exists
    if (slug && slug !== existingCourse.slug) {
      const slugTaken = await prisma.courses.findUnique({ where: { slug } });
      if (slugTaken) throw new AppError(400, "Course with this slug already exists.");
    }

    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Calculate total duration
      // Ensure modules is an array before using reduce
      const modulesArray = Array.isArray(modules) ? modules : [];
      const totalDuration = modulesArray.length > 0 ? modulesArray.reduce(
        (sum: number, m: any) => {
          // Ensure module has a lessons array
          if (!m.lessons) {
            m.lessons = [];
            return sum;
          }
          return sum + (Array.isArray(m.lessons) ? m.lessons.reduce((s: number, l: any) => s + (l && l.duration ? Number(l.duration) : 0), 0) : 0);
        },
        0
      ) : 0;

      // Prepare the final update data
      const updateData = {
        ...courseDetails,
        ...(totalDuration && { total_duration: totalDuration * 60 }),
        ...(slug && { slug }),
      };

      // Remove any non-Prisma schema fields that might cause issues
      // These fields would be handled through relations instead
      if ('thumbnail' in updateData) delete updateData.thumbnail;
      
      console.log('Course update data:', JSON.stringify(updateData, null, 2));
      
      // Update the course itself
      const updated = await tx.courses.update({
        where: { slug: courseSlug },
        data: updateData,
      });

      // Update or create modules
      if (modules && Array.isArray(modules)) {
        // Get existing module IDs from the database
        const existingModules = await tx.modules.findMany({
          where: { course_id: updated.id },
          select: { id: true }
        });
        const existingModuleIds = existingModules.map(m => m.id);
        
        // Get provided module IDs from the request (excluding new modules without IDs)
        const providedModuleIds = modules.filter(m => m && m.id).map(m => m.id);
        
        // Find modules to delete (existing modules not included in the update)
        const moduleIdsToDelete = existingModuleIds.filter(id => !providedModuleIds.includes(id));
        
        // Delete modules that aren't in the provided payload
        if (moduleIdsToDelete.length > 0) {
          // First delete lessons that belong to modules being deleted
          await tx.lessons.deleteMany({
            where: {
              module_id: {
                in: moduleIdsToDelete
              }
            }
          });
          
          // Then delete the modules themselves
          await tx.modules.deleteMany({
            where: {
              id: {
                in: moduleIdsToDelete
              }
            }
          });
        }
      
        for (const module of modules) {
          console.log("module check", module);
          
          // Skip invalid modules
          if (!module) continue;
          
          // Ensure module has a lessons array
          if (!module.lessons || !Array.isArray(module.lessons)) {
            module.lessons = [];
          }
      
          if (module.id) {
            const existingModule = await tx.modules.findUnique({ 
              where: { id: module.id },
              include: { lessons: true } 
            });
            if (!existingModule) throw new AppError(404, "Module not found");
            
            // Update existing module
            await tx.modules.update({
              where: { id: module.id },
              data: {
                title: module.title,
                order_position: module.order_position,
                duration: Array.isArray(module.lessons) ? 
                  module.lessons.reduce((sum: number, l: { duration?: number }) => sum + (l && l.duration ? Number(l.duration) : 0), 0) || 0 : 0,
              },
            });
      
            // Get existing lesson IDs for this module
            const existingLessonIds = existingModule.lessons.map(l => l.id);
            
            // Get provided lesson IDs (excluding new lessons without IDs)
            const providedLessonIds = module.lessons.filter(( l:any) => l.id).map((l:any) => l.id);
            
            // Find lessons to delete (existing lessons not included in the update)
            const lessonIdsToDelete = existingLessonIds.filter(id => !providedLessonIds.includes(id));
            
            // Delete lessons that aren't in the provided payload
            if (lessonIdsToDelete.length > 0) {
              await tx.lessons.deleteMany({
                where: {
                  id: {
                    in: lessonIdsToDelete
                  }
                }
              });
            }
      
            // Update or create lessons within the module if they exist
            if (module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0) {
              for (const lesson of module.lessons) {
                if (!lesson) continue;
                
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
            }
          } else {
            // Create new module if it doesn't exist
            const createdModule = await tx.modules.create({
              data: {
                title: module.title,
                order_position: module.order_position,
                duration: module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? 
                  module.lessons.reduce((sum: number, l: any) => sum + (l && l.duration ? Number(l.duration) : 0), 0) : 0,
                course_id: updated.id,
              },
            });
      
            // Create lessons for the new module if they exist
            if (module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0) {
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
      }

      return updated;
    });

    await clearCacheByPrefix(CACHE_KEYS.COURSES);
    await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseSlug}`));
    await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseSlug}`));


    return updatedCourse;
  } catch (error) {
   
    
    if (error instanceof AppError) throw error;
    
    // Create a more specific error message if possible
    const errorMessage = error instanceof Error 
      ? `Error updating course: ${error.message}` 
      : "Error updating course.";
    
    throw new AppError(500, errorMessage);
  }
};
