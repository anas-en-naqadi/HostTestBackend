import { Request, Response, NextFunction } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadConfig } from '../config/upload';
import { logger } from '../middleware/logging.middleware';
import { AppError } from '../middleware/error.middleware';
import redis from '../config/redis';

const TEMP_UPLOADS_DIR = uploadConfig.tempDir;
const SESSION_EXPIRATION = 86400; // 24 hours in seconds

interface UploadSession {
  uploadId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number[]; // Use an array for JSON compatibility
  purpose: 'lesson_video' | 'intro_video' | 'thumbnail';
  courseSlug?: string;
}

export const initiateUpload = async (req: Request, res: Response, next: NextFunction) => {
  const { fileName, totalChunks, purpose, courseSlug } = req.body;

  if (!fileName || !totalChunks || !purpose) {
    return next(new AppError(400, 'fileName, totalChunks, and purpose are required'));
  }

  if (purpose === 'lesson_video' && !courseSlug) {
    return next(new AppError(400, 'courseSlug is required for lesson videos'));
  }

  const uploadId = uuidv4();
  const tempDir = path.join(TEMP_UPLOADS_DIR, uploadId);

  await fs.ensureDir(tempDir);

  const session: UploadSession = {
    uploadId,
    fileName,
    totalChunks,
    uploadedChunks: [], // Initialize as an empty array
    purpose,
    courseSlug
  };

  await redis.set(uploadId, JSON.stringify(session), 'EX', SESSION_EXPIRATION);

  logger.info(`Initiated upload session ${uploadId} for ${fileName}`);
  res.status(201).json({ uploadId });
};

export const uploadChunk = async (req: Request, res: Response, next: NextFunction) => {
  const { uploadId, chunkIndex } = req.body;
  const chunk = req.file;

  if (!uploadId || !chunkIndex || !chunk) {
    return next(new AppError(400, 'uploadId, chunkIndex, and a file chunk are required'));
  }

  const sessionRaw = await redis.get(uploadId);
  if (!sessionRaw) {
    // If session is not found, delete the orphaned chunk file
    await fs.remove(chunk.path);
    return next(new AppError(404, 'Upload session not found or expired'));
  }

  const session: UploadSession = JSON.parse(sessionRaw);

  const tempDir = path.join(TEMP_UPLOADS_DIR, uploadId);
  const chunkPath = path.join(tempDir, chunkIndex.toString());

  await fs.move(chunk.path, chunkPath, { overwrite: true });

  const parsedChunkIndex = parseInt(chunkIndex, 10);
  if (!session.uploadedChunks.includes(parsedChunkIndex)) {
    session.uploadedChunks.push(parsedChunkIndex);
  }

  await redis.set(uploadId, JSON.stringify(session), 'EX', SESSION_EXPIRATION);

  logger.info(`Chunk ${chunkIndex} saved for upload ${uploadId}`);
  res.status(200).json({ message: 'Chunk uploaded successfully' });
};

export const completeUpload = async (req: Request, res: Response, next: NextFunction) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    return next(new AppError(400, 'uploadId is required'));
  }

  const sessionRaw = await redis.get(uploadId);
  if (!sessionRaw) {
    return next(new AppError(404, 'Upload session not found or expired'));
  }

  const session: UploadSession = JSON.parse(sessionRaw);

  if (session.uploadedChunks.length !== session.totalChunks) {
    return next(new AppError(400, 'Not all chunks have been uploaded'));
  }

  const tempDir = path.join(TEMP_UPLOADS_DIR, uploadId);
  const finalFileName = `${uuidv4()}-${session.fileName}`;

  let finalDir: string;
  switch (session.purpose) {
    case 'lesson_video':
      if (!session.courseSlug) {
        await fs.remove(tempDir);
        await redis.del(uploadId);
        return next(new AppError(400, 'Course slug is required for lesson videos'));
      }
      finalDir = uploadConfig.getCourseVideoPath(session.courseSlug);
      break;
    case 'intro_video':
      finalDir = uploadConfig.getIntroVideoPath();
      break;
    case 'thumbnail':
      finalDir = uploadConfig.getThumbnailPath();
      break;
    default:
      await fs.remove(tempDir);
      await redis.del(uploadId);
      return next(new AppError(500, 'Invalid purpose in session'));
  }

  await fs.ensureDir(finalDir);
  const finalPath = path.join(finalDir, finalFileName);

  try {
    const chunkPaths = session.uploadedChunks
      .sort((a, b) => a - b)
      .map(index => path.join(tempDir, index.toString()));

    const writeStream = fs.createWriteStream(finalPath);

    for (const chunkPath of chunkPaths) {
      const readStream = fs.createReadStream(chunkPath);
      await new Promise<void>((resolve, reject) => {
        readStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
    }

    await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        writeStream.end();
    });

    await fs.remove(tempDir);
    await redis.del(uploadId);

    const fileUrl = `${process.env.SERVER_URL}/${path.relative(uploadConfig.getAbsolutePath(), finalPath)}`.replace(/\\/g, '/');
    logger.info(`Completed upload ${uploadId}. File saved to ${finalPath}`);
    res.status(200).json({ message: 'File uploaded successfully', url: fileUrl });

  } catch (error) {
    logger.error(`Failed to merge chunks for upload ${uploadId}:`, error);
    
    await fs.remove(finalPath).catch(err => logger.error(`Failed to remove partial file ${finalPath}:`, err));
    await fs.remove(tempDir).catch(err => logger.error(`Failed to remove temp dir ${tempDir}:`, err));
    await redis.del(uploadId);

    return next(new AppError(500, 'Failed to process file. Please try again.'));
  }
};

export const abortUpload = async (req: Request, res: Response, next: NextFunction) => {
  const { uploadId } = req.body;

  if (!uploadId) {
    return res.status(400).json({ message: 'uploadId is required' });
  }

  const sessionRaw = await redis.get(uploadId);
  if (sessionRaw) {
    const tempDir = path.join(TEMP_UPLOADS_DIR, uploadId);
    await fs.remove(tempDir);
    await redis.del(uploadId);
    logger.info(`Aborted and cleaned up upload session ${uploadId}`);
  }

  res.status(200).json({ message: 'Upload aborted successfully' });
};
