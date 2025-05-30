import prisma from "../../config/prisma";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, generateCacheKey, deleteFromCache, deletePatternFromCache } from "../../utils/cache.utils";
import { formatThumbnailUrl } from "../../utils/url.utils";
import { lesson_content_type } from "../../types/course.types";
import { Prisma } from "@prisma/client";

// Helper function to retry a transaction with exponential backoff
async function retryTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        operation,
        {
          maxWait: 5000, // 5s max waiting time during the retry process
          timeout: 30000, // 30s transaction timeout
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        }
      );
    } catch (error) {
      lastError = error;
      console.log(`Transaction attempt ${attempt} failed:`, error);
      
      // Only retry on transaction-specific errors
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || 
          !error.message.includes('Transaction')) {
        throw error; // Don't retry on non-transaction errors
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(100 * Math.pow(2, attempt), 2000); // Max 2s delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError;
}
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

    const updatedCourse = await retryTransaction(async (tx) => {
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
            
            // Check if the module's order position has changed
            if (existingModule.order_position !== module.order_position) {
              try {
                // Check if there's already a module with the target position
                const moduleWithTargetPosition = await tx.modules.findFirst({
                  where: {
                    course_id: updated.id,
                    order_position: module.order_position,
                    id: { not: module.id } // Exclude the current module
                  }
                });
                
                if (moduleWithTargetPosition) {
                  // Use a temporary high position to avoid conflicts
                  const tempPosition = 999999;
                  
                  // First move the conflicting module to temp position
                  await tx.modules.update({
                    where: { id: moduleWithTargetPosition.id },
                    data: { order_position: tempPosition }
                  });
                  
                  // Now move our module to the target position
                  await tx.modules.update({
                    where: { id: module.id },
                    data: { order_position: module.order_position }
                  });
                  
                  // Finally move the conflicting module to our original position
                  await tx.modules.update({
                    where: { id: moduleWithTargetPosition.id },
                    data: { order_position: existingModule.order_position }
                  });
                } else {
                  // No conflict, just update the position directly
                  await tx.modules.update({
                    where: { id: module.id },
                    data: { order_position: module.order_position }
                  });
                }
              } catch (error) {
                console.error("Error updating module position:", error);
                throw new AppError(400, "Failed to update module order position. Please try a different position.");
              }
            }
            
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
                  
                  // Check if the lesson's order position has changed
                  if (existingLesson.order_position !== lesson.order_position) {
                    try {
                      // Check if there's already a lesson with the target position
                      const lessonWithTargetPosition = await tx.lessons.findFirst({
                        where: {
                          module_id: existingModule.id,
                          order_position: lesson.order_position,
                          id: { not: lesson.id } // Exclude the current lesson
                        }
                      });
                      
                      if (lessonWithTargetPosition) {
                        // Use a temporary high position to avoid conflicts
                        const tempPosition = 999999;
                        
                        // First move the conflicting lesson to temp position
                        await tx.lessons.update({
                          where: { id: lessonWithTargetPosition.id },
                          data: { order_position: tempPosition }
                        });
                        
                        // Now move our lesson to the target position
                        await tx.lessons.update({
                          where: { id: lesson.id },
                          data: { order_position: lesson.order_position }
                        });
                        
                        // Finally move the conflicting lesson to our original position
                        await tx.lessons.update({
                          where: { id: lessonWithTargetPosition.id },
                          data: { order_position: existingLesson.order_position }
                        });
                      } else {
                        // No conflict, just update the position directly
                        await tx.lessons.update({
                          where: { id: lesson.id },
                          data: { order_position: lesson.order_position }
                        });
                      }
                    } catch (error) {
                      console.error("Error updating lesson position:", error);
                      throw new AppError(400, "Failed to update lesson order position. Please try a different position.");
                    }
                  }
                  
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
                  // Get all existing lessons for this module, sorted by order position
                  const existingLessons = await tx.lessons.findMany({
                    where: {
                      module_id: existingModule.id
                    },
                    orderBy: { order_position: 'asc' }
                  });
                  
                  // Determine if we need to adjust positions
                  let targetPosition = lesson.order_position;
                  let needToAdjust = false;
                  
                  // Check if the position is already taken
                  for (const existingLesson of existingLessons) {
                    if (existingLesson.order_position === targetPosition) {
                      needToAdjust = true;
                      break;
                    }
                  }
                  
                  // If we need to adjust positions, do it one by one to avoid conflicts
                  if (needToAdjust) {
                    // Start from the highest position and move upward
                    for (let i = existingLessons.length - 1; i >= 0; i--) {
                      const currentLesson = existingLessons[i];
                      if (currentLesson.order_position >= targetPosition) {
                        await tx.lessons.update({
                          where: { id: currentLesson.id },
                          data: { order_position: currentLesson.order_position + 1 }
                        });
                      }
                    }
                  }
                  
                  // Create new lesson with the target position
                  await tx.lessons.create({
                    data: {
                      title: lesson.title,
                      content_type: lesson.content_type,
                      video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
                      lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
                      quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
                      duration: lesson.duration,
                      order_position: targetPosition,
                      module_id: existingModule.id,  // Associate lesson with the correct module
                    },
                  });
                }
              }
            }
          } else {
            // Find all existing modules for this course
            const existingModules = await tx.modules.findMany({
              where: { course_id: updated.id },
              orderBy: { order_position: 'asc' }
            });
            
            // Declare the variable outside the try/catch block so it's accessible later
            let createdModule;
            
            try {
              // Create the module with the requested position
              createdModule = await tx.modules.create({
                data: {
                  title: module.title,
                  order_position: module.order_position,
                  duration: module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? 
                    module.lessons.reduce((sum: number, l: any) => sum + (l && l.duration ? Number(l.duration) : 0), 0) : 0,
                  course_id: updated.id,
                },
              });
            } catch (error) {
              // If we encounter a unique constraint error, use an alternative position
              if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                console.log(`Module with order_position ${module.order_position} already exists, using next available position`);
                
                // Find the highest order_position currently in use
                const nextPosition = existingModules.length > 0 ?
                  Math.max(...existingModules.map(m => m.order_position)) + 1 : 1;
                
                console.log(`Using next available position: ${nextPosition} for new module`);
                
                // Create new module with the adjusted position
                createdModule = await tx.modules.create({
                  data: {
                    title: module.title,
                    order_position: nextPosition,
                    duration: module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? 
                      module.lessons.reduce((sum: number, l: any) => sum + (l && l.duration ? Number(l.duration) : 0), 0) : 0,
                    course_id: updated.id,
                  },
                });
              } else {
                // Re-throw other errors
                throw error;
              }
            }
      
            // Create lessons for the new module if they exist
            if (module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0) {
              // First, sort lessons by order_position to ensure we process them in order
              const sortedLessons = [...module.lessons].sort((a, b) => a.order_position - b.order_position);
              
              // Create a map to track the final positions
              const finalPositions = new Map<number, number>();
              let nextAvailablePosition = 1;
              
              // First pass: determine the final position for each lesson
              for (const lesson of sortedLessons) {
                const requestedPosition = lesson.order_position || nextAvailablePosition;
                
                // Find the next available position if this one is taken
                while (finalPositions.has(nextAvailablePosition)) {
                  nextAvailablePosition++;
                }
                
                // If the requested position is available, use it
                if (!finalPositions.has(requestedPosition)) {
                  finalPositions.set(requestedPosition, requestedPosition);
                  nextAvailablePosition = Math.max(nextAvailablePosition, requestedPosition + 1);
                } else {
                  // Otherwise use the next available position
                  finalPositions.set(requestedPosition, nextAvailablePosition);
                  nextAvailablePosition++;
                }
              }
              
              // Second pass: create each lesson with its final position
              for (const lesson of sortedLessons) {
                const requestedPosition = lesson.order_position || 1;
                const finalPosition = finalPositions.get(requestedPosition) || requestedPosition;
                
                await tx.lessons.create({
                  data: {
                    title: lesson.title,
                    content_type: lesson.content_type,
                    video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
                    lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
                    quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
                    duration: lesson.duration,
                    order_position: finalPosition,
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

    // Invalidate all related caches
    try {
      // Delete specific course caches
      await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseSlug}`));
      await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseSlug}`));
      
      // If the slug was changed, invalidate the old slug's caches too
      if (courseData.slug && courseData.slug !== courseSlug) {
        await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseData.slug}`));
        await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseData.slug}`));
      }
      
      // Clear user-specific course list caches (especially important for instructors)
      await deletePatternFromCache(`${CACHE_KEYS.COURSES}:user-*`);
      
      
      console.log(`Cache invalidated for course ${courseSlug} and all related caches`);
    } catch (cacheError) {
      // Just log cache errors but don't fail the operation
      console.error('Error invalidating cache after course update:', cacheError);
    }


    return updatedCourse;
  } catch (error) {
    console.error("Error updating course:", error);
    
    // Improve error handling with more detailed messages
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle transaction-specific errors
      if (error.message.includes("Transaction")) {
        throw new AppError(500, "Database transaction failed despite retry attempts. This could be due to high database load or connection issues. Please try again in a few moments.");
      }
      
      // Handle constraint violations
      if (error.code === 'P2002') {
        const targetField = error.meta?.target as string[] || [];
        
        // Handle specific unique constraint violations
        if (targetField.includes('order_position')) {
          if (targetField.includes('course_id')) {
            throw new AppError(400, `A module with this position already exists in this course. Please try a different position.`);
          } else if (targetField.includes('module_id')) {
            throw new AppError(400, `A lesson with this position already exists in this module. Please try a different position.`);
          } else {
            throw new AppError(400, `An item with this order position already exists. Please try a different position.`);
          }
        } else {
          throw new AppError(400, `A course with this ${targetField.join(', ') || 'attribute'} already exists.`);
        }
      }
      
      // Handle other Prisma errors
      throw new AppError(500, `Database error: ${error.message}`);
    }
    
    // Generic error fallback
    throw new AppError(500, "Error updating course. Please try again later.");
  }
};
