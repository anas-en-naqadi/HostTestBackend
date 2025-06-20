import path from 'path';

// Upload configuration with defaults from environment variables
export const uploadConfig = {
  // Base upload directory
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  
  // Specific directories
  introVideosDir: process.env.UPLOAD_DIR_INTRO_VIDEOS || 'intro_videos',
  courseVideosDir: process.env.UPLOAD_DIR_COURSE_VIDEOS || 'course_videos',
  thumbnailsDir: process.env.UPLOAD_DIR_THUMBNAILS || 'thumbnails',
  tempDir: process.env.UPLOAD_DIR_TEMP || 'temp',
  
  // File size limits (in MB, converted to bytes in the getter)
  get thumbnailMaxSize(): number {
    const sizeMB = parseInt(process.env.THUMBNAIL_MAX_LIMIT || '1024', 10);
    return sizeMB * 1024 * 1024; // Convert MB to bytes
  },
  
  get videoMaxSize(): number {
    const sizeMB = parseInt(process.env.VIDEO_MAX_LIMIT || '1024', 10);
    return sizeMB * 1024 * 1024; // Convert MB to bytes
  },
  
  // Get absolute paths for directories
  getAbsolutePath(subDir?: string): string {
    const baseDir = path.join(process.cwd(), this.uploadDir);
    return subDir ? path.join(baseDir, subDir) : baseDir;
  },
  
  // Get path for course videos
  getCourseVideoPath(courseSlug: string): string {
    return path.join(this.getAbsolutePath(this.courseVideosDir), courseSlug);
  },
  
  // Get path for intro videos
  getIntroVideoPath(): string {
    return this.getAbsolutePath(this.introVideosDir);
  },
  
  // Get path for thumbnails
  getThumbnailPath(): string {
    return this.getAbsolutePath(this.thumbnailsDir);
  },
  
  // Allowed file types
  allowedImageTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  allowedVideoTypes: ['.mp4', '.webm', '.ogg', '.mov', '.mkv']
};
