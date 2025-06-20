import { Request } from 'express';

/**
 * Extended Request interface that includes Multer file properties
 * This matches the Express-Multer typings
 */
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: { [fieldname: string]: Express.Multer.File[] };
}

/**
 * Helper type for course files
 */
export interface CourseFiles {
  thumbnail?: Express.Multer.File;
  intro_video?: Express.Multer.File;
}
