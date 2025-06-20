import { Request, Response } from 'express';
import multer from 'multer';
import { saveThumbnail, saveIntroVideo, saveLessonVideo } from '../../utils/file.utils';
import { AppError } from '../../middleware/error.middleware';
import { successResponse, errorResponse } from '../../utils/api.utils';
import { logger } from '../../middleware/logging.middleware';

// Multer config for thumbnail
const uploadThumbnail = multer({
  storage: multer.diskStorage({}), // Use disk storage to handle temp files
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file type. Only images are allowed.'));
    }
  },
}).single('thumbnail');

// Multer config for intro video
const uploadIntroVideo = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file type. Only videos are allowed.'));
    }
  },
}).single('introVideo');

// Multer config for lesson video
const uploadLessonVideo = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 1024 * 1024 * 500 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file type. Only videos are allowed.'));
    }
  },
}).single('lessonVideo');

export const uploadThumbnailController = (req: Request, res: Response) => {
  uploadThumbnail(req, res, err => {
    if (err) {
      logger.error('Thumbnail upload failed:', err);
      if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
      }
      return errorResponse(res, 'Error uploading thumbnail.', 500);
    }
    if (!req.file) {
      return errorResponse(res, 'No thumbnail file provided.', 400);
    }
    try {
      const thumbnailUrl = saveThumbnail(req.file);
      successResponse(res, { url: thumbnailUrl }, 'Thumbnail uploaded successfully.');
    } catch (saveErr) {
      logger.error('Error saving thumbnail:', saveErr);
      errorResponse(res, 'Failed to save thumbnail.');
    }
  });
};

export const uploadIntroVideoController = (req: Request, res: Response) => {
  uploadIntroVideo(req, res, err => {
    if (err) {
      logger.error('Intro video upload failed:', err);
      if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
      }
      return errorResponse(res, 'Error uploading intro video.', 500);
    }
    if (!req.file) {
      return errorResponse(res, 'No intro video file provided.', 400);
    }
    try {
      const videoUrl = saveIntroVideo(req.file);
      successResponse(res, { url: videoUrl }, 'Intro video uploaded successfully.');
    } catch (saveErr) {
      logger.error('Error saving intro video:', saveErr);
      errorResponse(res, 'Failed to save intro video.');
    }
  });
};

export const uploadLessonVideoController = (req: Request, res: Response) => {
  uploadLessonVideo(req, res, err => {
    const { courseSlug } = req.params;
    if (!courseSlug) {
        return errorResponse(res, 'Course slug is required.', 400);
    }
    if (err) {
      logger.error('Lesson video upload failed:', err);
      if (err instanceof AppError) {
        return errorResponse(res, err.message, err.statusCode);
      }
      return errorResponse(res, 'Error uploading lesson video.', 500);
    }
    if (!req.file) {
      return errorResponse(res, 'No lesson video file provided.', 400);
    }
    try {
      const videoUrl = saveLessonVideo(req.file, courseSlug);
      successResponse(res, { url: videoUrl }, 'Lesson video uploaded successfully.');
    } catch (saveErr) {
      logger.error('Error saving lesson video:', saveErr);
      errorResponse(res, 'Failed to save lesson video.');
    }
  });
};
