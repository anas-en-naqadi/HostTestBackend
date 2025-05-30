import express from 'express';
import path from 'path';
import fs from 'fs';

// Create static file middleware
export const setupStaticMiddleware = (app: express.Application) => {
  // Set up uploads directory
  const uploadsPath = path.join(__dirname, '../../uploads');
  
  // Set up certificates directory
  const certificatesPath = path.join(__dirname, '../../certificates');
  
  // Create specific directories for organization if they don't exist
  const thumbnailsPath = path.join(uploadsPath, 'thumbnails');
  const videosPath = path.join(uploadsPath, 'videos');
  const introVideosPath = path.join(uploadsPath, 'intro_videos');
  
  // Ensure directories exist
  [uploadsPath, certificatesPath, thumbnailsPath, videosPath, introVideosPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
  
  // Serve static files from certificates directory
  app.use('/certificates', express.static(certificatesPath));
  console.log(`Static file middleware configured for path: ${certificatesPath}`);
  
  // Configure static file serving with proper MIME types (only register once)
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, path) => {
      // Set appropriate MIME types for video files
      if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (path.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (path.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'video/ogg');
      } else if (path.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (path.endsWith('.mkv')) {
        res.setHeader('Content-Type', 'video/x-matroska');
      }
      
      // Add cache control headers for better performance
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    }
  }));
  
  console.log(`Static file middleware configured for uploads: ${uploadsPath}`);
  console.log(`Thumbnails path: ${thumbnailsPath}`);
  console.log(`Intro videos path: ${introVideosPath}`);
};