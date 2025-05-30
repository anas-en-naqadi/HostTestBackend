import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';
import winston from 'winston';

// Use the same logger configuration as in logging.middleware.ts
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const courseVideosDir = path.join(__dirname, '../../uploads/course_videos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(courseVideosDir)) {
  fs.mkdirSync(courseVideosDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // For lesson videos, store in course-specific subfolder
    if (file.fieldname.startsWith('lesson_video_')) {
      // Extract course slug from URL
      const courseSlug = req.params.slug;
      
      if (courseSlug) {
        // Create course-specific directory if it doesn't exist
        const courseDirPath = path.join(courseVideosDir, courseSlug);
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
    }
    
    // For other files (thumbnails, intro videos), use the default uploads directory
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type based on field name
  if (file.fieldname === 'thumbnail') {
    // Accept images only for thumbnails
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files (jpg, jpeg, png, gif,webp) are allowed for thumbnails!'));
    }
  } else if (file.fieldname === 'intro_video') {
    // Accept video files only for intro videos
    if (!file.originalname.match(/\.(mp4|webm|ogg|mov|mkv)$/)) {
      return cb(new Error('Only video files (mp4, webm, ogg, mov, mkv) are allowed for intro videos!'));
    }
  } else if (file.fieldname.startsWith('lesson_video_')) {
    // Accept video files for lesson videos
    if (!file.originalname.match(/\.(mp4|webm|ogg|mov|mkv)$/)) {
      return cb(new Error('Only video files (mp4, webm, ogg, mov, mkv) are allowed for lesson videos!'));
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
    fileSize: 100 * 1024 * 1024, // 100MB file size limit to accommodate videos
  },
  fileFilter: fileFilter,
});
