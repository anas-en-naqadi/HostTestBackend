/**
 * URL Utilities
 * Helper functions for URL formatting and manipulation
 */
import path from 'path';

/**
 * Returns a full URL including the server domain for a relative path
 * @param relativePath The relative path to convert to a full URL
 * @returns A complete URL with server domain
 */
export const getFullUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  
  // If it's already a full URL, return it as is
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Get server URL from environment or use default
  const serverUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  // Ensure proper formatting between server URL and path
  if (relativePath.startsWith('/')) {
    return `${serverUrl}${relativePath}`;
  } else {
    return `${serverUrl}/${relativePath}`;
  }
};

/**
 * Formats a thumbnail path to ensure it has a full URL
 * @param thumbnailPath The path to the thumbnail
 * @returns A full URL for the thumbnail
 */
export const formatThumbnailUrl = (thumbnailPath: string): string => {
  if (!thumbnailPath) return '';
  
  // If it's already a full URL, return it as is
  if (thumbnailPath.startsWith('http')) {
    return thumbnailPath;
  }
  
  // If it's a Windows file path, extract just the filename
  if (thumbnailPath.includes('\\') || thumbnailPath.includes('/')) {
    const filenameParts = thumbnailPath.split(/[\\\/]/);
    const filename = filenameParts[filenameParts.length - 1];
    
    // Get server URL from environment or use default (same as in file.utils.ts)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${backendUrl}/uploads/thumbnails/${filename}`;
  }
  
  // Otherwise, it's a relative path
  return getFullUrl(thumbnailPath);
};
