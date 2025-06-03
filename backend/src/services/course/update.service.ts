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
          maxWait: 10000, // Increased to 10s max waiting time
          timeout: 120000, // Increased to 2 minutes transaction timeout for large operations
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
        const delay = Math.min(200 * Math.pow(2, attempt), 5000); // Max 5s delay, increased base delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we've exhausted all retries
  throw lastError;
}

// Helper function to process modules in smaller batches
async function processModulesInBatches(
  tx: Prisma.TransactionClient,
  modules: any[],
  courseId: number,
  batchSize: number = 5
) {
  const results: any[] = [];
  
  for (let i = 0; i < modules.length; i += batchSize) {
    const batch = modules.slice(i, i + batchSize);
    console.log(`Processing module batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(modules.length / batchSize)}`);
    
    for (const module of batch) {
      if (!module) continue;
      
      // Ensure module has a lessons array
      if (!module.lessons || !Array.isArray(module.lessons)) {
        module.lessons = [];
      }

      if (module.id) {
        await updateExistingModule(tx, module, courseId);
      } else {
        await createNewModule(tx, module, courseId);
      }
    }
  }
  
  return results;
}

// Separate function to handle existing module updates
async function updateExistingModule(tx: Prisma.TransactionClient, module: any, courseId: number) {
  const existingModule = await tx.modules.findUnique({ 
    where: { id: module.id },
    include: { lessons: true } 
  });
  
  if (!existingModule) throw new AppError(404, "Module not found");
  
  // Handle order position changes
  if (existingModule.order_position !== module.order_position) {
    await handleModulePositionChange(tx, module, existingModule, courseId);
  }
  
  // Update module details
  await tx.modules.update({
    where: { id: module.id },
    data: {
      title: module.title,
      order_position: module.order_position,
      duration: Array.isArray(module.lessons) ? 
        module.lessons.reduce((sum: number, l: { duration?: number }) => sum + (l && l.duration ? Number(l.duration) : 0), 0) || 0 : 0,
    },
  });

  // Handle lessons for this module
  await handleModuleLessons(tx, module, existingModule);
}

// Separate function to handle new module creation
async function createNewModule(tx: Prisma.TransactionClient, module: any, courseId: number) {
  const existingModules = await tx.modules.findMany({
    where: { course_id: courseId },
    orderBy: { order_position: 'asc' }
  });
  
  let createdModule;
  
  try {
    createdModule = await tx.modules.create({
      data: {
        title: module.title,
        order_position: module.order_position,
        duration: module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? 
          module.lessons.reduce((sum: number, l: any) => sum + (l && l.duration ? Number(l.duration) : 0), 0) : 0,
        course_id: courseId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const nextPosition = existingModules.length > 0 ?
        Math.max(...existingModules.map(m => m.order_position)) + 1 : 1;
      
      createdModule = await tx.modules.create({
        data: {
          title: module.title,
          order_position: nextPosition,
          duration: module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? 
            module.lessons.reduce((sum: number, l: any) => sum + (l && l.duration ? Number(l.duration) : 0), 0) : 0,
          course_id: courseId,
        },
      });
    } else {
      throw error;
    }
  }

  // Create lessons for new module
  if (module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0) {
    await createLessonsForModule(tx, module.lessons, createdModule.id);
  }
}

// Handle module position changes
async function handleModulePositionChange(
  tx: Prisma.TransactionClient, 
  module: any, 
  existingModule: any, 
  courseId: number
) {
  try {
    const moduleWithTargetPosition = await tx.modules.findFirst({
      where: {
        course_id: courseId,
        order_position: module.order_position,
        id: { not: module.id }
      }
    });
    
    if (moduleWithTargetPosition) {
      const tempPosition = 999999;
      
      await tx.modules.update({
        where: { id: moduleWithTargetPosition.id },
        data: { order_position: tempPosition }
      });
      
      await tx.modules.update({
        where: { id: module.id },
        data: { order_position: module.order_position }
      });
      
      await tx.modules.update({
        where: { id: moduleWithTargetPosition.id },
        data: { order_position: existingModule.order_position }
      });
    } else {
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

// Handle lessons for a module
async function handleModuleLessons(tx: Prisma.TransactionClient, module: any, existingModule: any) {
  const existingLessonIds = existingModule.lessons.map((l: any) => l.id);
  const providedLessonIds = module.lessons.filter((l: any) => l.id).map((l: any) => l.id);
  const lessonIdsToDelete = existingLessonIds.filter((id: any) => !providedLessonIds.includes(id));
  
  // Delete lessons that aren't in the provided payload
  if (lessonIdsToDelete.length > 0) {
    await tx.lessons.deleteMany({
      where: { id: { in: lessonIdsToDelete } }
    });
  }

  // Process lessons in smaller batches to avoid timeout
  const lessonBatchSize = 10; // Process 10 lessons at a time
  
  for (let i = 0; i < module.lessons.length; i += lessonBatchSize) {
    const lessonBatch = module.lessons.slice(i, i + lessonBatchSize);
    
    for (const lesson of lessonBatch) {
      if (!lesson) continue;
      
      if (lesson.id) {
        await updateExistingLesson(tx, lesson, existingModule);
      } else {
        await createNewLesson(tx, lesson, existingModule.id);
      }
    }
  }
}

// Handle existing lesson updates
async function updateExistingLesson(tx: Prisma.TransactionClient, lesson: any, existingModule: any) {
  const existingLesson = await tx.lessons.findUnique({ where: { id: lesson.id } });
  if (!existingLesson) throw new AppError(404, "Lesson not found");
  
  // Handle lesson position changes
  if (existingLesson.order_position !== lesson.order_position) {
    await handleLessonPositionChange(tx, lesson, existingLesson, existingModule.id);
  }
  
  // Update lesson
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
}

// Handle lesson position changes
async function handleLessonPositionChange(
  tx: Prisma.TransactionClient,
  lesson: any,
  existingLesson: any,
  moduleId: number
) {
  try {
    const lessonWithTargetPosition = await tx.lessons.findFirst({
      where: {
        module_id: moduleId,
        order_position: lesson.order_position,
        id: { not: lesson.id }
      }
    });
    
    if (lessonWithTargetPosition) {
      const tempPosition = 999999;
      
      await tx.lessons.update({
        where: { id: lessonWithTargetPosition.id },
        data: { order_position: tempPosition }
      });
      
      await tx.lessons.update({
        where: { id: lesson.id },
        data: { order_position: lesson.order_position }
      });
      
      await tx.lessons.update({
        where: { id: lessonWithTargetPosition.id },
        data: { order_position: existingLesson.order_position }
      });
    } else {
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

// Create new lesson
async function createNewLesson(tx: Prisma.TransactionClient, lesson: any, moduleId: number) {
  const existingLessons = await tx.lessons.findMany({
    where: { module_id: moduleId },
    orderBy: { order_position: 'asc' }
  });
  
  let targetPosition = lesson.order_position;
  let needToAdjust = false;
  
  for (const existingLesson of existingLessons) {
    if (existingLesson.order_position === targetPosition) {
      needToAdjust = true;
      break;
    }
  }
  
  if (needToAdjust) {
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
  
  await tx.lessons.create({
    data: {
      title: lesson.title,
      content_type: lesson.content_type,
      video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
      lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
      quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
      duration: lesson.duration,
      order_position: targetPosition,
      module_id: moduleId,
    },
  });
}

// Create lessons for a new module
async function createLessonsForModule(tx: Prisma.TransactionClient, lessons: any[], moduleId: number) {
  const sortedLessons = [...lessons].sort((a, b) => a.order_position - b.order_position);
  const finalPositions = new Map<number, number>();
  let nextAvailablePosition = 1;
  
  // Determine final positions
  for (const lesson of sortedLessons) {
    const requestedPosition = lesson.order_position || nextAvailablePosition;
    
    while (finalPositions.has(nextAvailablePosition)) {
      nextAvailablePosition++;
    }
    
    if (!finalPositions.has(requestedPosition)) {
      finalPositions.set(requestedPosition, requestedPosition);
      nextAvailablePosition = Math.max(nextAvailablePosition, requestedPosition + 1);
    } else {
      finalPositions.set(requestedPosition, nextAvailablePosition);
      nextAvailablePosition++;
    }
  }
  
  // Create lessons in batches
  const batchSize = 10;
  for (let i = 0; i < sortedLessons.length; i += batchSize) {
    const batch = sortedLessons.slice(i, i + batchSize);
    
    for (const lesson of batch) {
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
          module_id: moduleId,
        },
      });
    }
  }
}

export const updateCourse = async (courseSlug: string, courseData: Partial<CreateCourseDto>) => {
  try {
    const existingCourse = await prisma.courses.findUnique({ where: { slug: courseSlug } });
    if (!existingCourse) throw new AppError(404, "Course not found");

    // Extract data from courseData
    const courseDataRecord = courseData as Record<string, any>;
    const { modules, slug, ...courseDetailsRaw } = courseDataRecord;
    
    // Process course details (same as before)
    const processedDetails: Record<string, any> = {};
    const allowedCourseFields = [
      'title', 'subtitle', 'description', 'difficulty', 'is_published', 
      'intro_video_url', 'total_duration'
    ];
    
    for (const key of Object.keys(courseDetailsRaw)) {
      if (allowedCourseFields.includes(key)) {
        processedDetails[key] = courseDetailsRaw[key];
      }
    }
    
    // Handle special cases (same as before)
    if ('category_id' in courseDetailsRaw) {
      const categoryId = typeof courseDetailsRaw.category_id === 'string'
        ? parseInt(courseDetailsRaw.category_id, 10)
        : courseDetailsRaw.category_id;
      
      processedDetails.categories = {
        connect: { id: categoryId }
      };
      delete processedDetails.category_id;
    }
    
    if ('instructor_id' in courseDetailsRaw) {
      const instructorId = typeof courseDetailsRaw.instructor_id === 'string'
        ? parseInt(courseDetailsRaw.instructor_id, 10)
        : courseDetailsRaw.instructor_id;
      
      processedDetails.user = {
        connect: { id: instructorId }
      };
      delete processedDetails.instructor_id;
    }
    
    if ('is_published' in courseDetailsRaw) {
      processedDetails.is_published = typeof courseDetailsRaw.is_published === 'string'
        ? courseDetailsRaw.is_published === 'true'
        : !!courseDetailsRaw.is_published;
    }
    
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
    
    if ('thumbnail' in courseDataRecord && typeof courseDataRecord.thumbnail === 'string') {
      processedDetails.thumbnail_url = formatThumbnailUrl(courseDataRecord.thumbnail);
    } else if ('thumbnail_url' in courseDataRecord && typeof courseDataRecord.thumbnail_url === 'string') {
      processedDetails.thumbnail_url = courseDataRecord.thumbnail_url;
    }
    
    const courseDetails = processedDetails;

    // Check slug uniqueness
    if (slug && slug !== existingCourse.slug) {
      const slugTaken = await prisma.courses.findUnique({ where: { slug } });
      if (slugTaken) throw new AppError(400, "Course with this slug already exists.");
    }

    const updatedCourse = await retryTransaction(async (tx) => {
      // Calculate total duration
      const modulesArray = Array.isArray(modules) ? modules : [];
      const totalDuration = modulesArray.length > 0 ? modulesArray.reduce(
        (sum: number, m: any) => {
          if (!m.lessons) {
            m.lessons = [];
            return sum;
          }
          return sum + (Array.isArray(m.lessons) ? m.lessons.reduce((s: number, l: any) => s + (l && l.duration ? Number(l.duration) : 0), 0) : 0);
        },
        0
      ) : 0;

      // Update course details first
      const updateData = {
        ...courseDetails,
        ...(totalDuration && { total_duration: totalDuration * 60 }),
        ...(slug && { slug }),
      };

      if ('thumbnail' in updateData) delete updateData.thumbnail;
      
      console.log('Course update data:', JSON.stringify(updateData, null, 2));
      
      const updated = await tx.courses.update({
        where: { slug: courseSlug },
        data: updateData,
      });

      // Process modules if they exist
      if (modules && Array.isArray(modules)) {
        // Clean up modules that are no longer needed
        const existingModules = await tx.modules.findMany({
          where: { course_id: updated.id },
          select: { id: true }
        });
        const existingModuleIds = existingModules.map(m => m.id);
        const providedModuleIds = modules.filter(m => m && m.id).map(m => m.id);
        const moduleIdsToDelete = existingModuleIds.filter(id => !providedModuleIds.includes(id));
        
        if (moduleIdsToDelete.length > 0) {
          await tx.lessons.deleteMany({
            where: { module_id: { in: moduleIdsToDelete } }
          });
          
          await tx.modules.deleteMany({
            where: { id: { in: moduleIdsToDelete } }
          });
        }
      
        // Process modules in batches to prevent timeouts
        await processModulesInBatches(tx, modules, updated.id);
      }

      return updated;
    });

    // Cache invalidation (same as before)
    try {
      await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseSlug}`));
      await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseSlug}`));
      
      if (courseData.slug && courseData.slug !== courseSlug) {
        await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `detail-${courseData.slug}`));
        await deleteFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${courseData.slug}`));
      }
      
      await deletePatternFromCache(`${CACHE_KEYS.COURSES}:user-*`);
      console.log(`Cache invalidated for course ${courseSlug} and all related caches`);
    } catch (cacheError) {
      console.error('Error invalidating cache after course update:', cacheError);
    }

    return updatedCourse;
  } catch (error) {
    console.error("Error updating course:", error);
    
    if (error instanceof AppError) {
      throw error;
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.message.includes("Transaction")) {
        throw new AppError(500, "Database transaction failed despite retry attempts. This could be due to high database load, large video processing, or connection issues. Please try uploading videos in smaller batches or try again in a few moments.");
      }
      
      if (error.code === 'P2002') {
        const targetField = error.meta?.target as string[] || [];
        
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
      
      throw new AppError(500, `Database error: ${error.message}`);
    }
    
    throw new AppError(500, "Error updating course. Please try again later.");
  }
};