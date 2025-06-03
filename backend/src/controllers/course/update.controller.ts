// In controllers/course/index.ts or controllers/course/update-handler.ts

import { Response, NextFunction } from 'express';
import { updateCourse } from '../../services/course/update.service';
import { AppError } from '../../middleware/error.middleware';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { saveThumbnail, deleteThumbnail, saveIntroVideo, deleteIntroVideo, saveLessonVideo, deleteLessonVideo } from '../../utils/file.utils';
import prisma from '../../config/prisma';
import { MulterRequest } from '../../types/multer.types';
import { lesson_content_type } from '../../types/course.types';
import { logActivity } from '../../utils/activity_log.utils';

// This is the Express route handler
export const updateCourseController = async (req: MulterRequest, res: Response, next: NextFunction) => {
  try {
    const courseSlug = req.params.slug;
    let thumbnailFile: Express.Multer.File | undefined;
    let introVideoFile: Express.Multer.File | undefined;
    const courseData = { ...req.body };
    console.log('Course update data:', JSON.stringify(courseData, null, 2));
    
    // Get the existing course to find the old files
    const existingCourse = await prisma.courses.findUnique({
      where: { slug: courseSlug },
      select: { thumbnail_url: true, intro_video_url: true }
    });
    
    // Handle file uploads if present with secure file handling
    
    // Check if we have files in the request (multi-part form data with multiple files)
    if (req.files) {
      // Process all files to find thumbnail and intro video
      Object.values(req.files).forEach(fileOrFiles => {
        const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
        
        // Type assertion to ensure TypeScript recognizes the file properties
        const typedFile = file as Express.Multer.File;
        
        if (typedFile.fieldname === 'thumbnail') {
          thumbnailFile = typedFile;
          console.log('Found thumbnail file:', typedFile.originalname);
        } else if (typedFile.fieldname === 'intro_video') {
          introVideoFile = typedFile;
          console.log('Found intro video file:', typedFile.originalname);
        }
      });
      
      // Type assertions to avoid TypeScript errors
      console.log('Thumbnail file:', thumbnailFile ? (thumbnailFile as Express.Multer.File).originalname : 'None');
      console.log('Intro video file:', introVideoFile ? (introVideoFile as Express.Multer.File).originalname : 'None');
    } else if (req.file) {
      // Backward compatibility for single file uploads
      thumbnailFile = req.file;
      console.log('Thumbnail file (single upload):', thumbnailFile ? (thumbnailFile as Express.Multer.File).originalname : 'None');
    }
    
    // Parse modules from JSON string if needed
    if (typeof courseData.modules === 'string') {
      try {
        courseData.modules = JSON.parse(courseData.modules);
        console.log('Parsed modules from JSON string');
      } catch (e) {
        console.error('Error parsing modules from JSON string:', e);
      }
    }
    
    // Parse what_you_will_learn from JSON string if needed
    if (typeof courseData.what_you_will_learn === 'string') {
      try {
        courseData.what_you_will_learn = JSON.parse(courseData.what_you_will_learn);
      } catch (e) {
        console.error('Error parsing what_you_will_learn from JSON string:', e);
      }
    }
    
    // Parse course_requirements from JSON string if needed
    if (typeof courseData.course_requirements === 'string') {
      try {
        courseData.course_requirements = JSON.parse(courseData.course_requirements);
      } catch (e) {
        console.error('Error parsing course_requirements from JSON string:', e);
      }
    }
    
    // Process files and update courseData
    let hasErrors = false;
    
    // Handle thumbnail file if present
    if (thumbnailFile) {
      try {
        if (existingCourse && existingCourse.thumbnail_url) {
          // Delete the old thumbnail file
          const deleted = deleteThumbnail(existingCourse.thumbnail_url);
          if (deleted) {
            console.log(`Deleted old thumbnail for course ${courseSlug}`);
          }
        }
        
        // Save the new thumbnail using our secure file handling utility
        const thumbnailUrl = saveThumbnail(thumbnailFile);
        courseData.thumbnail_url = thumbnailUrl;
        console.log('Updated thumbnail to:', thumbnailUrl);
      } catch (error) {
        console.error('Error processing thumbnail:', error);
        // Don't send response yet, just mark that we had an error
        hasErrors = true;
        // Continue with the rest of the update
      }
    }
    
    // Handle intro video file if present
    if (introVideoFile) {
      try {
        if (existingCourse && existingCourse.intro_video_url) {
          // Delete the old intro video file
          const deleted = deleteIntroVideo(existingCourse.intro_video_url);
          if (deleted) {
            console.log(`Deleted old intro video for course ${courseSlug}`);
          }
        }
        
        // Save the new intro video using our secure file handling utility
        const introVideoUrl = saveIntroVideo(introVideoFile);
        courseData.intro_video_url = introVideoUrl;
        console.log('Updated intro video to:', introVideoUrl);
      } catch (error) {
        console.error('Error processing intro video:', error);
        // Don't send response yet, just mark that we had an error
        hasErrors = true;
        // Continue with the rest of the update
      }
    } else {
      // Check if we're switching from an uploaded video to a URL-based video
      // This happens when there's no new file upload but there's an intro_video_url in the request
      // that doesn't contain '/uploads/' (which would indicate it's a server-stored file)
      if (existingCourse && 
          existingCourse.intro_video_url && 
          existingCourse.intro_video_url.includes('/uploads/') && 
          courseData.intro_video_url && 
          !courseData.intro_video_url.includes('/uploads/')) {
        
        try {
          // User is switching from an uploaded video to a URL, so delete the old uploaded video
          const deleted = deleteIntroVideo(existingCourse.intro_video_url);
          if (deleted) {
            console.log(`Deleted old uploaded intro video for course ${courseSlug} as user switched to URL`);
          }
        } catch (error) {
          console.error('Error deleting old intro video when switching to URL:', error);
          // Don't fail the whole operation if we can't delete the old video
          hasErrors = true;
        }
      }
    }
    
    // Process lesson video uploads if present
    if (req.files) {
      // Look for lesson video files in the request
      Object.entries(req.files).forEach(([fieldName, files]) => {
        console.log('Processing field:', fieldName, 'Type:', typeof fieldName);
        
        // Get the actual file and type assert to ensure TypeScript recognizes the file properties
        const videoFile = (Array.isArray(files) ? files[0] : files) as Express.Multer.File;
        
        // Check the fieldname property of the file itself, which should contain the original field name
        const originalFieldName = videoFile.fieldname;
        console.log('Original field name from file:', originalFieldName);
        
        // Check if this is a lesson video field
        if (originalFieldName && originalFieldName.includes('lesson_video_')) {
          // Case 1: Format lesson_video_lessonId (for existing lessons)
          if (originalFieldName.startsWith('lesson_video_') && !originalFieldName.includes('new_new')) {
            const indices = originalFieldName.replace('lesson_video_', '').split('_');
            console.log('Indices:', indices);
            
            if (indices.length === 1) {
              // This is an existing lesson with an ID
              const lessonId = parseInt(indices[0]);
              console.log(`Found lesson video for existing lesson ID: ${lessonId}`);
              
              // Find the lesson in any module by its ID
              const lesson = courseData.modules
                .flatMap((m: any) => m.lessons)
                .find((l: any) => l.id === lessonId);
              
              console.log('Found lesson:', lesson ? 'Yes' : 'No');
              
              if (lesson && lesson.content_type === lesson_content_type.VIDEO) {
                try {
                  // Check if there's an existing video to delete
                  if (lesson.video_url && lesson.video_url.includes('/uploads/')) {
                    const deleted = deleteLessonVideo(lesson.video_url);
                    if (deleted) {
                      console.log(`Deleted old video for lesson ${lessonId}`);
                    }
                  }
                  
                  // Save the new video and get the URL
                  const videoUrl = saveLessonVideo(videoFile, courseSlug);
                  lesson.video_url = videoUrl;
                  console.log(`Saved video for lesson ${lessonId} to: ${videoUrl}`);
                } catch (error) {
                  console.error(`Error handling video for lesson ${lessonId}:`, error);
                  hasErrors = true;
                }
              }
            }
          }
          // Case 2: Format lesson_video_moduleIndex_lessonIndex (for backward compatibility)
          else if (originalFieldName.startsWith('lesson_video_') && originalFieldName.replace('lesson_video_', '').split('_').length === 2) {
            const indices = originalFieldName.replace('lesson_video_', '').split('_');
            const moduleIndex = parseInt(indices[0]);
            const lessonIndex = parseInt(indices[1]);
            
            console.log(`Found lesson video for module ${moduleIndex}, lesson ${lessonIndex}`);
            
            // Make sure the module and lesson exist in the data
            if (Array.isArray(courseData.modules) && 
                courseData.modules[moduleIndex] && 
                Array.isArray(courseData.modules[moduleIndex].lessons) && 
                courseData.modules[moduleIndex].lessons[lessonIndex]) {
              
              const lesson = courseData.modules[moduleIndex].lessons[lessonIndex];
              
              // Only process if this is a video lesson
              if (lesson.content_type === lesson_content_type.VIDEO) {
                try {
                  // Check if there's an existing video to delete
                  if (lesson.video_url && lesson.video_url.includes('/uploads/')) {
                    const deleted = deleteLessonVideo(lesson.video_url);
                    if (deleted) {
                      console.log(`Deleted old lesson video for module ${moduleIndex}, lesson ${lessonIndex}`);
                    }
                  }
                  
                  // Save the new video and get the URL
                  const videoUrl = saveLessonVideo(videoFile, courseSlug);
                  lesson.video_url = videoUrl;
                  console.log(`Saved lesson video for module ${moduleIndex}, lesson ${lessonIndex} to: ${videoUrl}`);
                } catch (error) {
                  console.error(`Error handling lesson video for module ${moduleIndex}, lesson ${lessonIndex}:`, error);
                  hasErrors = true;
                }
              }
            }
          }
          // Case 3: Format lesson_video_new_new_timestamp_random (for new lessons)
          else if (originalFieldName.includes('lesson_video_new_new_')) {
            const tempId = originalFieldName.replace('lesson_video_new_new_', '');
            console.log(`Found lesson video for new lesson with temp ID: ${tempId}`);
            
            // Find the new lesson in any module by matching its temporary ID pattern in the field
            let foundLesson: any = null;
            let foundModule: any = null;
            let foundLessonIndex = -1;
            
            // Search through all modules and lessons to find the new lesson
            courseData.modules.forEach((module: any, moduleIndex: number) => {
              if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach((lesson: any, lessonIndex: number) => {
                  // New lessons won't have an ID property
                  if (!lesson.id && lesson.content_type === lesson_content_type.VIDEO) {
                    // This is a new lesson, let's use it
                    if (!foundLesson) {
                      foundLesson = lesson;
                      foundModule = module;
                      foundLessonIndex = lessonIndex;
                    }
                  }
                });
              }
            });
            
            if (foundLesson) {
              console.log(`Found new lesson in module: ${foundModule.title}, position: ${foundLessonIndex}`);
              
              try {
                // Save the new video and get the URL
                const videoUrl = saveLessonVideo(videoFile, courseSlug);
                foundLesson.video_url = videoUrl;
                console.log(`Saved video for new lesson to: ${videoUrl}`);
              } catch (error) {
                console.error(`Error handling video for new lesson:`, error);
                hasErrors = true;
              }
            } else {
              console.error(`Could not find a matching new lesson for temp ID: ${tempId}`);
            }
          }
        }
      });
    }
    
    // Process lesson videos that are URLs (not uploaded files)
    if (courseData.modules) {
      // Ensure modules is an array
      let modulesArray: any[] = [];
      
      if (Array.isArray(courseData.modules)) {
        modulesArray = courseData.modules;
      }
      
      // Replace the modules with the parsed array
      courseData.modules = modulesArray;
      
      // Process each module and lesson
      modulesArray.forEach((module: any, moduleIndex: number) => {
        if (module.lessons && Array.isArray(module.lessons)) {
          module.lessons.forEach((lesson: any, lessonIndex: number) => {
            // If this is a video lesson with video_url but no file was uploaded
            if (lesson.content_type === lesson_content_type.VIDEO && lesson.video_url) {
              // Check if we're switching from an uploaded video to a URL-based video
              if (lesson.id) { // This is an existing lesson being updated
                // We'll need to check if the video_url has changed from an uploaded file to an external URL
                // This will be handled in the update service since we need to query the database
                console.log(`Using provided video URL for module ${moduleIndex}, lesson ${lessonIndex}: ${lesson.video_url}`);
              } else {
                // For new lessons, just log the URL
                console.log(`Using provided video URL for new lesson in module ${moduleIndex}, lesson ${lessonIndex}: ${lesson.video_url}`);
              }
            }
          });
        }
      });
    }
    
    // If we had file processing errors but want to continue with the update
    if (hasErrors) {
      console.warn('There were errors processing files, but continuing with course update');
    }
    
    // Update the course in the database
    const updatedCourse = await updateCourse(courseSlug, courseData);
    
    // Log the activity
    logActivity(
      req.user?.id!,
      'COURSE_UPDATED',
      `${req.user?.full_name} updated course: ${updatedCourse.title} (${courseSlug})`,
      req.ip
    ).catch(console.error);
    
    // Send a single response at the end
    return successResponse(res, updatedCourse);
  } catch (error) {
    console.log('Update course error:', error);
    // Prevent multiple responses by using return
    if (error instanceof AppError) {
      return errorResponse(res, error.message, error.statusCode, error.errors);
    }
    return next(error);
  }
};