import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { uploadConfig } from '../config/upload';

// Get all directory paths from the upload configuration
const UPLOADS_DIR = uploadConfig.getAbsolutePath();
const THUMBNAILS_DIR = uploadConfig.getThumbnailPath();
const INTRO_VIDEOS_DIR = uploadConfig.getIntroVideoPath();
const COURSE_VIDEOS_DIR = uploadConfig.getAbsolutePath(uploadConfig.courseVideosDir);

// Ensure all required directories exist
const ensureAllDirectoriesExist = () => {
  // Base uploads directory
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`Created base uploads directory: ${UPLOADS_DIR}`);
  }

  // Thumbnails directory
  if (!fs.existsSync(THUMBNAILS_DIR)) {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
    console.log(`Created thumbnails directory: ${THUMBNAILS_DIR}`);
  }

  // Intro videos directory
  if (!fs.existsSync(INTRO_VIDEOS_DIR)) {
    fs.mkdirSync(INTRO_VIDEOS_DIR, { recursive: true });
    console.log(`Created intro videos directory: ${INTRO_VIDEOS_DIR}`);
  }

  // Course videos directory
  if (!fs.existsSync(COURSE_VIDEOS_DIR)) {
    fs.mkdirSync(COURSE_VIDEOS_DIR, { recursive: true });
    console.log(`Created course videos directory: ${COURSE_VIDEOS_DIR}`);
  }
};

// Create all required directories on module load
ensureAllDirectoriesExist();

/**
 * Generate a secure filename for uploaded files
 * This prevents path traversal attacks and filename collisions
 */
export const generateSecureFilename = (originalFilename: string): string => {
  const ext = path.extname(originalFilename).toLowerCase();
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
};

/**
 * Save an uploaded file to the thumbnails directory with a secure filename
 * Returns the full URL to the saved file
 */
export const saveThumbnail = (file: Express.Multer.File): string => {
  const secureFilename = generateSecureFilename(file.originalname);
  const destPath = path.join(THUMBNAILS_DIR, secureFilename);
  
  try {
    // Copy the file from temporary upload location to thumbnails directory
    fs.copyFileSync(file.path, destPath);
    
    // Try to delete the temporary file, but don't fail if it can't be deleted
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn(`Could not delete temporary file ${file.path}:`, error);
      // Continue execution even if temp file deletion fails
    }
    
    // Get the backend URL from environment or use default
    const backendUrl = process.env.SERVER_URL;
    
    // Return the full URL for the thumbnail
    return `${backendUrl}/${uploadConfig.thumbnailsDir}/${secureFilename}`;
  } catch (error) {
    console.error(`Error saving thumbnail ${file.originalname}:`, error);
    throw new Error(`Failed to save thumbnail: ${(error as Error).message}`);
  }
};

/**
 * Save an uploaded intro video file with a secure filename
 * Returns the full URL to the saved file
 * Includes validation for video file types
 */
export const saveIntroVideo = (file: Express.Multer.File): string => {
  // Validate file type (additional security check)
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
  if (!validVideoTypes.includes(file.mimetype)) {
    throw new Error(`Invalid video file type: ${file.mimetype}. Supported types: mp4, webm, ogg, mov, mkv`);
  }
  
  const secureFilename = generateSecureFilename(file.originalname);
  const destPath = path.join(INTRO_VIDEOS_DIR, secureFilename);
  
  // Copy the file from temporary upload location to videos directory
  fs.copyFileSync(file.path, destPath);
  
  // Delete the temporary file
  fs.unlinkSync(file.path);
  
  // Get the backend URL from environment or use default
  const backendUrl = process.env.SERVER_URL;
  
  // Return the full URL for the video
  return `${backendUrl}/${uploadConfig.introVideosDir}/${secureFilename}`;
};

/**
 * Get the absolute path for a thumbnail URL
 */
export const getThumbnailPath = (thumbnailUrl: string): string => {
  if (!thumbnailUrl) return '';
  
  try {
    // Extract filename from URL
    const urlParts = thumbnailUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Return absolute path
    return path.join(THUMBNAILS_DIR, filename);
  } catch (error) {
    console.error(`Error getting thumbnail path for ${thumbnailUrl}:`, error);
    return '';
  }
};

/**
 * Get the absolute path for an intro video URL
 */
export const getVideoPath = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  try {
    // Extract filename from URL
    const urlParts = videoUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    // Return absolute path
    return path.join(INTRO_VIDEOS_DIR, filename);
  } catch (error) {
    console.error(`Error getting video path for ${videoUrl}:`, error);
    return '';
  }
};

/**
 * Check if an intro video file exists
 */
export const videoExists = (videoUrl: string): boolean => {
  if (!videoUrl) return false;
  
  try {
    const videoPath = getVideoPath(videoUrl);
    return fs.existsSync(videoPath);
  } catch (error) {
    console.error('Error checking if video exists:', error);
    return false;
  }
};

/**
 * Delete an intro video file
 * @param videoUrl The URL of the intro video to delete
 * @returns true if deletion was successful, false otherwise
 */
export const deleteIntroVideo = (videoUrl: string): boolean => {
  if (!videoUrl) return false;
  
  try {
    // Get the file path from the URL
    const videoPath = getVideoPath(videoUrl);
    
    // Check if the file exists
    if (fs.existsSync(videoPath)) {
      // Delete the file
      fs.unlinkSync(videoPath);
      console.log(`Deleted intro video: ${videoPath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting intro video:', error);
    return false;
  }
};

/**
 * Check if a thumbnail file exists
 */
export const thumbnailExists = (thumbnailUrl: string): boolean => {
  if (!thumbnailUrl) return false;
  
  try {
    const thumbnailPath = getThumbnailPath(thumbnailUrl);
    return fs.existsSync(thumbnailPath);
  } catch (error) {
    console.error('Error checking if thumbnail exists:', error);
    return false;
  }
};

/**
 * Delete a thumbnail file
 * @param thumbnailUrl The URL of the thumbnail to delete
 * @returns true if deletion was successful, false otherwise
 */
export const deleteThumbnail = (thumbnailUrl: string): boolean => {
  if (!thumbnailUrl) return false;
  
  try {
    // Get the file path from the URL
    const thumbnailPath = getThumbnailPath(thumbnailUrl);
    
    // Check if the file exists
    if (fs.existsSync(thumbnailPath)) {
      try {
        // Try to delete the file with retries
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            fs.unlinkSync(thumbnailPath);
            console.log(`Deleted thumbnail: ${thumbnailPath}`);
            return true;
          } catch (unlinkError) {
            // If file is busy/locked (EBUSY) or in use by another process (EPERM)
            if ((unlinkError as NodeJS.ErrnoException).code === 'EBUSY' || 
                (unlinkError as NodeJS.ErrnoException).code === 'EPERM') {
              attempts++;
              if (attempts < maxAttempts) {
                // Wait a bit before retrying
                console.log(`Thumbnail file locked, retrying... (${attempts}/${maxAttempts})`);
                // In a synchronous context, we can't use setTimeout, so just continue
              } else {
                console.warn(`Could not delete thumbnail after ${maxAttempts} attempts: ${thumbnailPath}`);
                // Return true anyway since we don't want to fail the whole operation
                return true;
              }
            } else {
              // For other errors, rethrow
              throw unlinkError;
            }
          }
        }
      } catch (error) {
        console.error(`Error deleting thumbnail ${thumbnailPath}:`, error);
        // Return true anyway to prevent failing the whole operation
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in deleteThumbnail function:', error);
    return false;
  }
};

/**
 * Ensure a course-specific directory exists for lesson videos
 * @param courseSlug The slug of the course
 * @returns The path to the course videos directory
 */
export const ensureCourseVideosDir = (courseSlug: string): string => {
  const courseDir = uploadConfig.getCourseVideoPath(courseSlug);
  if (!fs.existsSync(courseDir)) {
    fs.mkdirSync(courseDir, { recursive: true });
  }
  return courseDir;
};

/**
 * Save an uploaded lesson video file to a course-specific directory
 * @param file The uploaded video file
 * @param courseSlug The slug of the course this lesson belongs to
 * @returns The URL to the saved video file
 */
export const saveLessonVideo = (file: Express.Multer.File, courseSlug: string): string => {
  // Validate file type (additional security check)
  const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
  if (!validVideoTypes.includes(file.mimetype)) {
    throw new Error(`Invalid video file type: ${file.mimetype}. Supported types: mp4, webm, ogg, mov, mkv`);
  }
  
  // Ensure course directory exists
  const courseDir = ensureCourseVideosDir(courseSlug);
  
  const secureFilename = generateSecureFilename(file.originalname);
  const destPath = path.join(courseDir, secureFilename);
  
  try {
    // Copy the file from temporary upload location to course videos directory
    fs.copyFileSync(file.path, destPath);
    
    // Try to delete the temporary file
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn(`Could not delete temporary file ${file.path}:`, error);
      // Continue execution even if temp file deletion fails
    }
    
    // Get the backend URL from environment or use default
    const backendUrl = process.env.SERVER_URL;
    
    // Return the full URL for the video
    return `${backendUrl}/${uploadConfig.courseVideosDir}/${courseSlug}/${secureFilename}`;
  } catch (error) {
    console.error(`Error saving lesson video ${file.originalname}:`, error);
    throw new Error(`Failed to save lesson video: ${(error as Error).message}`);
  }
};

/**
 * Get the absolute path for a lesson video URL
 * @param videoUrl The URL of the lesson video
 * @returns The absolute path to the video file
 */
export const getLessonVideoPath = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  try {
    // Extract course slug and filename from URL
    // URL format: <backend>/<uploadDir>/<courseVideosDir>/<course-slug>/<filename>
    const urlParts = videoUrl.split('/');
    
    // Get the last two segments (course-slug and filename)
    const filename = urlParts[urlParts.length - 1];
    const courseSlug = urlParts[urlParts.length - 2];
    
    // Return absolute path
    return path.join(COURSE_VIDEOS_DIR, courseSlug, filename);
  } catch (error) {
    console.error(`Error getting lesson video path for ${videoUrl}:`, error);
    return '';
  }
};

/**
 * Check if a lesson video file exists
 * @param videoUrl The URL of the lesson video
 * @returns true if the file exists, false otherwise
 */
export const lessonVideoExists = (videoUrl: string): boolean => {
  if (!videoUrl) return false;
  
  try {
    const videoPath = getLessonVideoPath(videoUrl);
    return fs.existsSync(videoPath);
  } catch (error) {
    console.error('Error checking if lesson video exists:', error);
    return false;
  }
};

/**
 * Delete a lesson video file
 * @param videoUrl The URL of the lesson video to delete
 * @returns true if deletion was successful, false otherwise
 */
export const deleteLessonVideo = (videoUrl: string): boolean => {
  if (!videoUrl) return false;
  
  try {
    // Get the file path from the URL
    const videoPath = getLessonVideoPath(videoUrl);
    
    // Check if the file exists
    if (fs.existsSync(videoPath)) {
      // Delete the file
      fs.unlinkSync(videoPath);
      console.log(`Deleted lesson video: ${videoPath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting lesson video:', error);
    return false;
  }
};
