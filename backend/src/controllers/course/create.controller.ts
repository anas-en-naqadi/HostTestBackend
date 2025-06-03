import { Response } from "express";
import { createCourse } from "../../services/course/create.service";
import { successResponse, errorResponse } from "../../utils/api.utils";
import { CreateCourseDto } from "../../types/course.types";
import { AppError } from "../../middleware/error.middleware";
import { createCourseSchema } from "../../validation/course.validation";
import { getCourseBySlug } from "../../services/course/listBySlug.service";
import { saveThumbnail, saveIntroVideo, saveLessonVideo } from "../../utils/file.utils";
import { MulterRequest } from "../../types/multer.types";
import { lesson_content_type } from "../../types/course.types";
import { logActivity } from "../../utils/activity_log.utils";

// Controller for creating a course
export const createCourseController = async (req: MulterRequest, res: Response) => {
  try {
    console.log('Received course creation request with body:', JSON.stringify(req.body, null, 2));
    
    // Handle file uploads if present with secure file handling
    let thumbnailFile, introVideoFile;
    
    // Log all files received for debugging
    console.log("files", req.files);
    
    // Check if we have files in the request (multi-part form data with multiple files)
    if (req.files) {
      // Based on the logs, we can see req.files is an array in this application
      if (Array.isArray(req.files)) {
        // Find files by fieldname in the array
        thumbnailFile = req.files.find(file => file.fieldname === 'thumbnail');
        introVideoFile = req.files.find(file => file.fieldname === 'intro_video');
        
        console.log('Found files in array format');
        console.log('Thumbnail file:', thumbnailFile ? thumbnailFile.originalname : 'None');
        console.log('Intro video file:', introVideoFile ? introVideoFile.originalname : 'None');
      } else {
        // If req.files is an object with arrays for each field (not the case here, but keeping for compatibility)
        thumbnailFile = req.files['thumbnail']?.[0];
        introVideoFile = req.files['intro_video']?.[0];
        
        console.log('Found files in object format');
        console.log('Thumbnail file:', thumbnailFile ? thumbnailFile.originalname : 'None');
        console.log('Intro video file:', introVideoFile ? introVideoFile.originalname : 'None');
      }
    } else if (req.file) {
      // Backward compatibility for single file uploads
      thumbnailFile = req.file;
      console.log('Thumbnail file (single upload):', thumbnailFile ? thumbnailFile.originalname : 'None');
    }
    
    // Parse body data with proper validation
    let bodyData = req.body;
    
    // Parse JSON strings from FormData - do this first before any other processing
    if (typeof bodyData.what_you_will_learn === 'string') {
      try {
        bodyData.what_you_will_learn = JSON.parse(bodyData.what_you_will_learn);
      } catch (e) {
        console.error('Error parsing what_you_will_learn:', e);
      }
    }
    
    if (typeof bodyData.course_requirements === 'string') {
      try {
        bodyData.course_requirements = JSON.parse(bodyData.course_requirements);
      } catch (e) {
        console.error('Error parsing course_requirements:', e);
      }
    }
    
    if (typeof bodyData.modules === 'string') {
      try {
        bodyData.modules = JSON.parse(bodyData.modules);
        console.log('Parsed modules from JSON string');
      } catch (e) {
        console.error('Error parsing modules:', e);
      }
    }
    
    // Process lesson video uploads if present
    if (req.files) {
      // Create a temporary slug for storing videos if not provided
      const tempSlug = bodyData.slug || `temp-${Date.now()}`;
      
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
          console.log("Processing lesson video field:", originalFieldName);
          
          // Case 1: Format lesson_video_new_moduleIndex_lessonIndex
          if (originalFieldName.startsWith('lesson_video_new_') && !originalFieldName.startsWith('lesson_video_new_new_')) {
            // Extract indices from the format lesson_video_new_moduleIndex_lessonIndex
            const parts = originalFieldName.replace('lesson_video_new_', '').split('_');
            console.log("Parsed parts:", parts);
            
            if (parts.length === 2) {
              const moduleIndex = parseInt(parts[0]);
              const lessonIndex = parseInt(parts[1]);
              
              console.log(`Found lesson video for module ${moduleIndex}, lesson ${lessonIndex}`);
              
              // Make sure the module and lesson exist in the data
              if (bodyData.modules && 
                  bodyData.modules[moduleIndex] && 
                  bodyData.modules[moduleIndex].lessons && 
                  bodyData.modules[moduleIndex].lessons[lessonIndex]) {
                
                const lesson = bodyData.modules[moduleIndex].lessons[lessonIndex];
                console.log("Lesson found:", lesson);
                
                // Only process if this is a video lesson
                if (lesson.content_type === lesson_content_type.VIDEO) {
                  try {
                    // Save the video and get the URL
                    const videoUrl = saveLessonVideo(videoFile, tempSlug);
                    lesson.video_url = videoUrl;
                    console.log(`Saved lesson video for module ${moduleIndex}, lesson ${lessonIndex} to: ${videoUrl}`);
                  } catch (error) {
                    console.error(`Error saving lesson video for module ${moduleIndex}, lesson ${lessonIndex}:`, error);
                  }
                }
              } else {
                console.error(`Module or lesson not found for indices: module ${moduleIndex}, lesson ${lessonIndex}`);
                console.log('Available modules structure:', JSON.stringify(bodyData.modules, null, 2));
              }
            } else {
              console.error(`Invalid format for lesson_video_new_ field: ${originalFieldName}`);
            }
          }
          // Case 2: Original format lesson_video_moduleIndex_lessonIndex (without "new")
          else if (originalFieldName.startsWith('lesson_video_') && !originalFieldName.includes('new')) {
            const indices = originalFieldName.replace('lesson_video_', '').split('_');
            const moduleIndex = parseInt(indices[0]);
            const lessonIndex = parseInt(indices[1]);
            
            console.log(`Found lesson video (original format) for module ${moduleIndex}, lesson ${lessonIndex}`);
            
            // Make sure the module and lesson exist in the data
            if (bodyData.modules && 
                bodyData.modules[moduleIndex] && 
                bodyData.modules[moduleIndex].lessons && 
                bodyData.modules[moduleIndex].lessons[lessonIndex]) {
              
              const lesson = bodyData.modules[moduleIndex].lessons[lessonIndex];
              console.log("Lesson found (original format):", lesson);
              
              // Only process if this is a video lesson
              if (lesson.content_type === lesson_content_type.VIDEO) {
                try {
                  // Save the video and get the URL
                  const videoUrl = saveLessonVideo(videoFile, tempSlug);
                  lesson.video_url = videoUrl;
                  console.log(`Saved lesson video for module ${moduleIndex}, lesson ${lessonIndex} to: ${videoUrl}`);
                } catch (error) {
                  console.error(`Error saving lesson video for module ${moduleIndex}, lesson ${lessonIndex}:`, error);
                }
              }
            }
          }
          // Case 2: Format lesson_video_new_new_timestamp_random (for new lessons)
          else if (originalFieldName.includes('lesson_video_new_new_')) {
            const tempId = originalFieldName.replace('lesson_video_new_new_', '');
            console.log(`Found lesson video for new lesson with temp ID: ${tempId}`);
            
            // Find the new lesson in any module by matching its temporary ID pattern in the field
            let foundLesson: any = null;
            let foundModule: any = null;
            let foundLessonIndex = -1;
            
            // Search through all modules and lessons to find the new lesson
            if (bodyData.modules && Array.isArray(bodyData.modules)) {
              bodyData.modules.forEach((module: any, moduleIndex: number) => {
                if (module.lessons && Array.isArray(module.lessons)) {
                  module.lessons.forEach((lesson: any, lessonIndex: number) => {
                    // New lessons won't have an ID property
                    if (!lesson.id && lesson.content_type === lesson_content_type.VIDEO && !lesson.video_url) {
                      // This is a new lesson without a video URL, let's use it
                      if (!foundLesson) {
                        foundLesson = lesson;
                        foundModule = module;
                        foundLessonIndex = lessonIndex;
                      }
                    }
                  });
                }
              });
            }
            
            if (foundLesson) {
              console.log(`Found new lesson in module: ${foundModule.title || 'Unnamed'}, position: ${foundLessonIndex}`);
              
              try {
                // Save the new video and get the URL
                const videoUrl = saveLessonVideo(videoFile, tempSlug);
                foundLesson.video_url = videoUrl;
                console.log(`Saved video for new lesson to: ${videoUrl}`);
              } catch (error) {
                console.error(`Error handling video for new lesson:`, error);
              }
            } else {
              console.error(`Could not find a matching new lesson for temp ID: ${tempId}`);
            }
          }
        }
      });
    }
    
    // Convert string boolean to actual boolean
    if (bodyData.is_published === 'true') {
      bodyData.is_published = true;
    } else if (bodyData.is_published === 'false') {
      bodyData.is_published = false;
    }
    
    // Convert numeric strings to numbers
    if (bodyData.instructor_id) {
      bodyData.instructor_id = Number(bodyData.instructor_id);
    }
    
    if (bodyData.category_id) {
      bodyData.category_id = Number(bodyData.category_id);
    }
    
    // Handle thumbnail file if present using secure file handling utilities
    if (thumbnailFile) {
      try {
        // Log the thumbnail file details for debugging
        console.log('Processing thumbnail file:', {
          fieldname: thumbnailFile.fieldname,
          originalname: thumbnailFile.originalname,
          path: thumbnailFile.path,
          size: thumbnailFile.size
        });
        
        // Save the thumbnail using our secure file handling utility
        const thumbnailUrl = saveThumbnail(thumbnailFile);
        bodyData.thumbnail_url = thumbnailUrl;
        console.log('Saved thumbnail to:', thumbnailUrl);
      } catch (error) {
        console.error('Error saving thumbnail:', error);
        throw new AppError(400, 'Error processing thumbnail file: ' + (error as Error).message);
      }
    } else {
      console.log('No thumbnail file provided');
      // Ensure we have a default empty string for thumbnail_url if not provided
      bodyData.thumbnail_url = bodyData.thumbnail_url || '';
    }
    
    // Handle intro video file if present
    if (introVideoFile) {
      try {
        // Log the intro video file details for debugging
        console.log('Processing intro video file:', {
          fieldname: introVideoFile.fieldname,
          originalname: introVideoFile.originalname,
          path: introVideoFile.path,
          size: introVideoFile.size
        });
        
        // Save the intro video using our secure file handling utility
        const introVideoUrl = saveIntroVideo(introVideoFile);
        bodyData.intro_video_url = introVideoUrl;
        console.log('Saved intro video to:', introVideoUrl);
      } catch (error) {
        console.error('Error saving intro video:', error);
        throw new AppError(400, 'Error processing intro video file: ' + (error as Error).message);
      }
    } else {
      console.log('No intro video file provided');
      // Ensure we have a default empty string for intro_video_url if not provided
      bodyData.intro_video_url = bodyData.intro_video_url || '';
    }

    // Ensure thumbnail_url and intro_video_url are properly set and logged
    console.log('Processed body data with file URLs:', {
      ...bodyData,
      thumbnail_url: bodyData.thumbnail_url || 'Not set',
      intro_video_url: bodyData.intro_video_url || 'Not set'
    });
    
    // Process lesson videos that are URLs (not uploaded files)
    if (bodyData.modules && Array.isArray(bodyData.modules)) {
      bodyData.modules.forEach((module: any, moduleIndex: number) => {
        if (module.lessons && Array.isArray(module.lessons)) {
          module.lessons.forEach((lesson: any, lessonIndex: number) => {
            // If this is a video lesson with video_url but no file was uploaded
            if (lesson.content_type === lesson_content_type.VIDEO && lesson.video_url) {
              // If it's a URL that doesn't point to our uploads directory, keep it as is
              // This handles external video URLs (YouTube, Vimeo, etc.)
              console.log(`Using provided video URL for module ${moduleIndex}, lesson ${lessonIndex}: ${lesson.video_url}`);
            }
          });
        }
      });
    }
    
    // Ensure thumbnail_url and intro_video_url are properly set before validation
    console.log('Final data before validation:', {
      thumbnail_url: bodyData.thumbnail_url,
      intro_video_url: bodyData.intro_video_url
    });
    
    // Validate the processed body data
    const parsedBody = createCourseSchema.parse(bodyData);
    
    // Double-check that the URLs are still present after validation
    parsedBody.thumbnail_url = bodyData.thumbnail_url;
    parsedBody.intro_video_url = bodyData.intro_video_url;
    
    const userId = req.user?.id;
    if(!userId){
      throw new AppError(401,"User Unauthenticated");
    }

    // Create the course using the validated data
    const newCourse = await createCourse(parsedBody as CreateCourseDto, userId);
    
    // Log the activity
    logActivity(
      userId,
      'COURSE_CREATED',
      `${req.user?.full_name} created a new course: ${newCourse.title}`,
      req.ip
    ).catch(console.error);
    
    // Respond with the created course
    successResponse(res, newCourse);
  } catch (err) {
    console.log(err);
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } 
    else {
      errorResponse(res, "Internal server error");
    }
  }
};
