import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';
import redis from '../config/redis';
import prisma from '../config/prisma'; // Import Prisma client
import { logger } from '../middleware/logging.middleware';
import { uploadConfig } from '../config/upload';

const TEMP_UPLOADS_DIR = uploadConfig.tempDir;
const FINAL_UPLOADS_DIR = uploadConfig.getAbsolutePath(); // The root directory for final uploads

/**
 * Scans the temporary upload directory and removes any orphaned chunk folders.
 * An orphaned folder is one that does not have a corresponding active session in Redis.
 */
const cleanupOrphanedChunks = async () => {
  logger.info('Starting orphaned chunk cleanup job...');
  try {
    const entries = await fs.readdir(TEMP_UPLOADS_DIR, { withFileTypes: true });
    const subdirectories = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    if (subdirectories.length === 0) {
      logger.info('No temporary upload directories to clean up.');
      return;
    }

    let cleanedCount = 0;
    for (const uploadId of subdirectories) {
      const sessionExists = await redis.exists(uploadId);
      if (!sessionExists) {
        const dirPath = path.join(TEMP_UPLOADS_DIR, uploadId);
        try {
          await fs.remove(dirPath);
          logger.info(`Removed orphaned temp directory: ${dirPath}`);
          cleanedCount++;
        } catch (error) {
          logger.error(`Failed to remove orphaned directory ${dirPath}:`, error);
        }
      }
    }

    logger.info(`Orphaned chunk cleanup finished. Removed ${cleanedCount} directories.`);
  } catch (error) {
    // This handles errors like the temp directory not existing
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        logger.info('Temporary uploads directory does not exist. Nothing to clean up.');
    } else {
        logger.error('An unexpected error occurred during orphaned chunk cleanup:', error);
    }
  }
};

/**
 * Scans the final uploads directory and removes any files not referenced in the database.
 */
const cleanupOrphanedFiles = async () => {
  logger.info('Starting orphaned files cleanup job...');
  try {
    // 1. Get all file paths from the database
    const [courses, lessons] = await Promise.all([
      prisma.courses.findMany({ select: { thumbnail_url: true, intro_video_url: true } }),
      prisma.lessons.findMany({ select: { video_url: true } })
    ]);

    const activeUrls = new Set<string>();
    courses.forEach(course => {
      if (course.thumbnail_url) activeUrls.add(course.thumbnail_url);
      if (course.intro_video_url) activeUrls.add(course.intro_video_url);
    });
    lessons.forEach(lesson => {
      if (lesson.video_url) activeUrls.add(lesson.video_url);
    });

    // 2. Get all file paths from the filesystem
    const allFiles = await getAllFiles(FINAL_UPLOADS_DIR);
    let cleanedCount = 0;

    // 3. Compare and delete orphaned files
    for (const filePath of allFiles) {
      const fileUrl = `${process.env.SERVER_URL}/${path.relative(FINAL_UPLOADS_DIR, filePath)}`.replace(/\\/g, '/');
      if (!activeUrls.has(fileUrl)) {
        try {
          await fs.remove(filePath);
          logger.info(`Removed orphaned file: ${filePath}`);
          cleanedCount++;
        } catch (error) {
          logger.error(`Failed to remove orphaned file ${filePath}:`, error);
        }
      }
    }

    logger.info(`Orphaned files cleanup finished. Removed ${cleanedCount} files.`);
  } catch (error) {
    logger.error('An unexpected error occurred during orphaned files cleanup:', error);
  }
};

// Helper function to recursively get all file paths in a directory
const getAllFiles = async (dirPath: string, arrayOfFiles: string[] = []) => {
  try {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if ((await fs.stat(fullPath)).isDirectory()) {
        await getAllFiles(fullPath, arrayOfFiles);
      } else {
        arrayOfFiles.push(fullPath);
      }
    }
  } catch (error) {
    logger.error(`Could not read directory ${dirPath} for file cleanup:`, error);
  }
  return arrayOfFiles;
};

/**
 * Schedules all cleanup jobs.
 */
export const scheduleCleanupJobs = () => {
  // Schedule orphaned chunk cleanup to run every hour
  cron.schedule('0 * * * *', cleanupOrphanedChunks, {
    scheduled: true,
    timezone: 'UTC'
  });
  logger.info('Scheduled orphaned chunk cleanup to run hourly.');

  // Schedule orphaned file cleanup to run daily at 2 AM
  cron.schedule('0 2 * * *', cleanupOrphanedFiles, {
    scheduled: true,
    timezone: 'UTC'
  });
  logger.info('Scheduled orphaned file cleanup to run daily at 2 AM (UTC).');
};
