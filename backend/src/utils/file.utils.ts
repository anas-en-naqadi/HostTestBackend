import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Base uploads directory path
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Create course thumbnail directory
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

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
  
  // Copy the file from temporary upload location to thumbnails directory
  fs.copyFileSync(file.path, destPath);
  
  // Delete the temporary file
  fs.unlinkSync(file.path);
  
  // Get the backend URL from environment or use default
  const backendUrl = process.env.SERVER_URL;
  
  // Return the full URL for the thumbnail
  return `${backendUrl}/uploads/thumbnails/${secureFilename}`;
};

/**
 * Get the absolute path for a thumbnail URL
 */
export const getThumbnailPath = (thumbnailUrl: string): string => {
  if (!thumbnailUrl) return '';
  
  // Extract the filename from the URL (works with both relative and full URLs)
  const urlPath = new URL(thumbnailUrl, process.env.SERVER_URL).pathname;
  const filename = path.basename(urlPath);
  return path.join(THUMBNAILS_DIR, filename);
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
      // Delete the file
      fs.unlinkSync(thumbnailPath);
      console.log(`Deleted thumbnail: ${thumbnailPath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return false;
  }
};
