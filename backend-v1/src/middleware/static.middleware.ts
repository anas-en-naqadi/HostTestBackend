import express from 'express';
import path from 'path';
import fs from 'fs';

// Create static file middleware
export const setupStaticMiddleware = (app: express.Application) => {
  const uploadsPath = path.join(__dirname, '../../uploads');
  const certificatesPath = path.join(__dirname, '../../certificates');

  // Define paths for different upload types
  const thumbnailsPath = path.join(uploadsPath, 'thumbnails');
  const introVideosPath = path.join(uploadsPath, 'intro_videos');
  const courseVideosPath = path.join(uploadsPath, 'course_videos');

  // Ensure all necessary directories exist
  [uploadsPath, certificatesPath, thumbnailsPath, introVideosPath, courseVideosPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  // Shared options for static file serving
  const staticOptions = {
    setHeaders: (res: express.Response, filePath: string) => {
      if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
      else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
      else if (filePath.endsWith('.ogg')) res.setHeader('Content-Type', 'video/ogg');
      // Add other video types as needed

      // Set cache control for better performance
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    }
  };

  // --- Static Routes ---
  // Serve certificate files
  app.use('/certificates', express.static(certificatesPath));

  // Serve upload files from their specific URL paths
  app.use('/thumbnails', express.static(thumbnailsPath));
  app.use('/intro_videos', express.static(introVideosPath, staticOptions));
  app.use('/course_videos', express.static(courseVideosPath, staticOptions));

  console.log('Static file middleware configured for:');
  console.log(`- Certificates: /certificates -> ${certificatesPath}`);
  console.log(`- Thumbnails: /thumbnails -> ${thumbnailsPath}`);
  console.log(`- Intro Videos: /intro_videos -> ${introVideosPath}`);
  console.log(`- Course Videos: /course_videos -> ${courseVideosPath}`);
};