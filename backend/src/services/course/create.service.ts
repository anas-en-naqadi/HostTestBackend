import prisma from "../../config/prisma";
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { clearCacheByPrefix, CACHE_KEYS, deletePatternFromCache } from "../../utils/cache.utils";
import { lesson_content_type } from "../../types/course.types";
import { sendNotification } from "../../utils/notification.utils";
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

// Helper function to create modules in batches
async function createModulesInBatches(
  tx: Prisma.TransactionClient,
  modules: CreateModuleDto[],
  courseId: number,
  batchSize: number = 5
) {
  const createdModules = [];
  
  for (let i = 0; i < modules.length; i += batchSize) {
    const batch = modules.slice(i, i + batchSize);
    console.log(`Creating module batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(modules.length / batchSize)}`);
    
    for (const module of batch) {
      const createdModule = await createSingleModule(tx, module, courseId);
      createdModules.push(createdModule);
    }
  }
  
  return createdModules;
}

// Helper function to create a single module with its lessons
async function createSingleModule(
  tx: Prisma.TransactionClient,
  module: CreateModuleDto,
  courseId: number
) {
  // Calculate module duration
  const duration = module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);

  // Create the module with position conflict handling
  let createdModule;
  try {
    createdModule = await tx.modules.create({
      data: {
        title: module.title,
        order_position: module.order_position,
        duration,
        course_id: courseId,
      },
    });
  } catch (error) {
    // Handle position conflicts by finding the next available position
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.log(`Module with order_position ${module.order_position} already exists, finding next available position`);
      
      // Find the highest order_position currently in use for this course
      const existingModules = await tx.modules.findMany({
        where: { course_id: courseId },
        orderBy: { order_position: 'desc' },
        take: 1
      });
      
      const nextPosition = existingModules.length > 0 ? existingModules[0].order_position + 1 : 1;
      
      console.log(`Using next available position: ${nextPosition} for module: ${module.title}`);
      
      createdModule = await tx.modules.create({
        data: {
          title: module.title,
          order_position: nextPosition,
          duration,
          course_id: courseId,
        },
      });
    } else {
      throw error;
    }
  }

  // Create lessons for this module in batches
  if (module.lessons && module.lessons.length > 0) {
    await createLessonsInBatches(tx, module.lessons, createdModule.id);
  }

  return createdModule;
}

// Helper function to create lessons in batches
async function createLessonsInBatches(
  tx: Prisma.TransactionClient,
  lessons: CreateLessonDto[],
  moduleId: number,
  batchSize: number = 10
) {
  // Sort lessons by order_position to maintain proper order
  const sortedLessons = [...lessons].sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
  
  for (let i = 0; i < sortedLessons.length; i += batchSize) {
    const batch = sortedLessons.slice(i, i + batchSize);
    console.log(`Creating lesson batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sortedLessons.length / batchSize)} for module ${moduleId}`);
    
    for (const lesson of batch) {
      await createSingleLesson(tx, lesson, moduleId);
    }
  }
}

// Helper function to create a single lesson with position conflict handling
async function createSingleLesson(
  tx: Prisma.TransactionClient,
  lesson: CreateLessonDto,
  moduleId: number
) {
  try {
    await tx.lessons.create({
      data: {
        title: lesson.title,
        content_type: lesson.content_type,
        video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
        lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
        quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
        duration: lesson.duration || 0,
        order_position: lesson.order_position || 1,
        module_id: moduleId,
      },
    });
  } catch (error) {
    // Handle position conflicts by finding the next available position
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.log(`Lesson with order_position ${lesson.order_position} already exists in module ${moduleId}, finding next available position`);
      
      // Find the highest order_position currently in use for this module
      const existingLessons = await tx.lessons.findMany({
        where: { module_id: moduleId },
        orderBy: { order_position: 'desc' },
        take: 1
      });
      
      const nextPosition = existingLessons.length > 0 ? existingLessons[0].order_position + 1 : 1;
      
      console.log(`Using next available position: ${nextPosition} for lesson: ${lesson.title}`);
      
      await tx.lessons.create({
        data: {
          title: lesson.title,
          content_type: lesson.content_type,
          video_url: lesson.content_type === lesson_content_type.VIDEO ? lesson.video_url : null,
          lesson_text: lesson.content_type === lesson_content_type.TEXT ? lesson.lesson_text : null,
          quiz_id: lesson.content_type === lesson_content_type.QUIZ ? lesson.quiz_id : null,
          duration: lesson.duration || 0,
          order_position: nextPosition,
          module_id: moduleId,
        },
      });
    } else {
      throw error;
    }
  }
}

// Helper function to validate course data before processing
function validateCourseData(courseData: CreateCourseDto) {
  if (!courseData.modules || courseData.modules.length === 0) {
    throw new AppError(400, "Course must have at least one module");
  }

  // Check for duplicate module positions
  const modulePositions = courseData.modules.map(m => m.order_position).filter(Boolean);
  const uniquePositions = new Set(modulePositions);
  if (modulePositions.length !== uniquePositions.size) {
    console.warn("Duplicate module positions detected, will be resolved automatically");
  }

  // Check for duplicate lesson positions within modules
  courseData.modules.forEach((module, moduleIndex) => {
    if (module.lessons && module.lessons.length > 0) {
      const lessonPositions = module.lessons.map(l => l.order_position).filter(Boolean);
      const uniqueLessonPositions = new Set(lessonPositions);
      if (lessonPositions.length !== uniqueLessonPositions.size) {
        console.warn(`Duplicate lesson positions detected in module ${moduleIndex + 1}, will be resolved automatically`);
      }
    }
  });
}

export const createCourse = async (courseData: CreateCourseDto, userId: number) => {
  try {
    // Validate course data structure
    validateCourseData(courseData);

    const { modules, ...courseDetails } = courseData;

    // Check if slug already exists (outside transaction to fail early)
    const existingCourse = await prisma.courses.findUnique({
      where: { slug: courseDetails.slug },
    });
    if (existingCourse) {
      throw new AppError(400, "Course with this slug already exists.");
    }

    // Calculate total duration
    const totalDuration = modules.reduce(
      (total, module) => {
        if (!module.lessons || module.lessons.length === 0) return total;
        return total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
      },
      0
    );

    console.log(`Creating course with ${modules.length} modules and total duration: ${totalDuration} minutes`);

    // Use the retry mechanism for transaction
    const createdCourse = await retryTransaction(async (tx) => {
      // Create the course with default values for required fields
      const newCourse = await tx.courses.create({
        data: {
          ...courseDetails,
          total_duration: totalDuration * 60, // Convert to seconds
          // Provide default values for required fields if they're missing
          thumbnail_url: courseDetails.thumbnail_url || '',
          intro_video_url: courseDetails.intro_video_url || '',
        },
      });

      console.log(`Course created with ID: ${newCourse.id}, now creating modules...`);

      // Create modules and their lessons in batches to prevent timeouts
      if (modules && modules.length > 0) {
        await createModulesInBatches(tx, modules, newCourse.id);
      }

      console.log(`All modules and lessons created successfully for course: ${newCourse.title}`);
      return newCourse;
    });

    // Log success with the actual course data
    console.log("created_course", {
      id: createdCourse.id,
      title: createdCourse.title,
      slug: createdCourse.slug,
      modules_count: modules.length,
      total_duration: totalDuration
    });
    
    // Invalidate all related caches
    try {
      // Clear user-specific course list caches including instructor's own courses
      await deletePatternFromCache(`${CACHE_KEYS.COURSES}:user-*`);
      
      console.log(`Cache invalidated for all course lists after creating course: ${createdCourse.title}`);
    } catch (cacheError) {
      // Just log cache errors but don't fail the operation
      console.error('Error invalidating cache after course creation:', cacheError);
    }
    
    // Send notification about the new course (outside of transaction to prevent delays)
    try {
      await sendNotification({
        title: 'New Course Available',
        user_id: createdCourse.instructor_id,
        type: 'NEW_COURSE',
        content: `A new course <b>${createdCourse.title}</b> is now open for enrollment!`,
        metadata: { slug: createdCourse.slug, thumbnail_url: createdCourse.thumbnail_url },
      }, userId, "instructor");
    } catch (notificationError) {
      // Log notification errors but don't fail the course creation
      console.error('Error sending notification after course creation:', notificationError);
    }
    
    return createdCourse;
  } catch (error) {
    console.error("Error creating course:", error);
    
    // Improve error handling with more detailed messages
    if (error instanceof AppError) {
      throw error;
    }
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle transaction-specific errors
      if (error.message.includes("Transaction")) {
        throw new AppError(500, "Database transaction failed despite retry attempts. This could be due to high database load, large video processing, or connection issues. Please try creating the course with fewer modules/lessons at a time, or try again in a few moments.");
      }
      
      // Handle constraint violations
      if (error.code === 'P2002') {
        const targetField = error.meta?.target as string[] || [];
        
        if (targetField.includes('slug')) {
          throw new AppError(400, "A course with this slug already exists.");
        } else if (targetField.includes('order_position')) {
          throw new AppError(400, "There was a conflict with the ordering of modules or lessons. This has been automatically resolved.");
        } else {
          throw new AppError(400, `A course with this ${targetField.join(', ') || 'attribute'} already exists.`);
        }
      }
      
      // Handle other Prisma errors
      throw new AppError(500, `Database error: ${error.message}`);
    }
    
    // Generic error fallback
    throw new AppError(500, "Error creating course. Please try again later.");
  }
};