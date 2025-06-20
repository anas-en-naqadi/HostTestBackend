import { Router } from 'express';
import multer from 'multer';
import { initiateUpload, uploadChunk, completeUpload, abortUpload } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadConfig } from '../config/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Multer setup for handling single chunk uploads to a temporary directory
const chunkUpload = multer({ dest: uploadConfig.tempDir });

// All upload routes are protected
router.use(authenticate);

router.post('/initiate', asyncHandler(initiateUpload));
router.post('/chunk', chunkUpload.single('chunk'), asyncHandler(uploadChunk));
router.post('/complete', asyncHandler(completeUpload));
router.post('/abort', asyncHandler(abortUpload));

export default router;
