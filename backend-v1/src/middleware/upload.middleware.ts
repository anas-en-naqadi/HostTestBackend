import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';
import winston from 'winston';
import { uploadConfig } from '../config/upload';
import { logger } from './logging.middleware';

// Ensure all required upload directories exist
const ensureDirectoriesExist = () => {
  // Base uploads directory
  const baseDir = uploadConfig.getAbsolutePath();
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    logger.info(`Created base uploads directory: ${baseDir}`);
  }

  // Course videos directory
  const courseVideosDir = uploadConfig.getAbsolutePath(uploadConfig.courseVideosDir);
  if (!fs.existsSync(courseVideosDir)) {
    fs.mkdirSync(courseVideosDir, { recursive: true });
    logger.info(`Created course videos directory: ${courseVideosDir}`);
  }

  // Intro videos directory
  const introVideosDir = uploadConfig.getAbsolutePath(uploadConfig.introVideosDir);
  if (!fs.existsSync(introVideosDir)) {
    fs.mkdirSync(introVideosDir, { recursive: true });
    logger.info(`Created intro videos directory: ${introVideosDir}`);
  }

  // Thumbnails directory
  const thumbnailsDir = uploadConfig.getAbsolutePath(uploadConfig.thumbnailsDir);
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
    logger.info(`Created thumbnails directory: ${thumbnailsDir}`);
  }
};

// Create all required directories
ensureDirectoriesExist();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // For lesson videos, store in course-specific subfolder
    if (file.fieldname.startsWith('lesson_video_')) {
      // Extract course slug from URL
      const courseSlug = req.params.slug;
      
      if (courseSlug) {
        // Create course-specific directory if it doesn't exist
        const courseDirPath = uploadConfig.getCourseVideoPath(courseSlug);
        if (!fs.existsSync(courseDirPath)) {
          try {
            fs.mkdirSync(courseDirPath, { recursive: true });
            logger.info(`Created course videos directory: ${courseDirPath}`);
          } catch (error) {
            logger.error(`Failed to create course directory: ${error}`);
          }
        }
        return cb(null, courseDirPath);
      }
    } else if (file.fieldname === 'intro_video') {
      // For intro videos, use the intro videos directory
      const introVideosDir = uploadConfig.getIntroVideoPath();
      return cb(null, introVideosDir);
    } else if (file.fieldname === 'thumbnail') {
      // For thumbnails, use the thumbnails directory
      const thumbnailsDir = uploadConfig.getThumbnailPath();
      return cb(null, thumbnailsDir);
    }
    
    // For other files, use the default uploads directory
    cb(null, uploadConfig.getAbsolutePath());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Get file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check file type based on field name
  if (file.fieldname === 'thumbnail') {
    // Accept images only for thumbnails
    if (!uploadConfig.allowedImageTypes.includes(ext)) {
      return cb(new Error(`Only image files (${uploadConfig.allowedImageTypes.join(', ')}) are allowed for thumbnails!`));
    }
  } else if (file.fieldname === 'intro_video' || file.fieldname.startsWith('lesson_video_')) {
    // Accept video files for intro videos and lesson videos
    if (!uploadConfig.allowedVideoTypes.includes(ext)) {
      return cb(new Error(`Only video files (${uploadConfig.allowedVideoTypes.join(', ')}) are allowed for videos!`));
    }
  } else {
    // For any other field, reject the file
    return cb(new Error('Unexpected field name: ' + file.fieldname));
  }
  
  cb(null, true);
};

// Export upload middleware
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: uploadConfig.videoMaxSize, // Use dynamic file size limit from config
  },
  fileFilter: fileFilter,
});

// Export a specialized middleware for thumbnails with lower file size limit
export const uploadThumbnail = multer({
  storage: storage,
  limits: {
    fileSize: uploadConfig.thumbnailMaxSize, // Use dynamic thumbnail size limit from config
  },
  fileFilter: fileFilter,
});
