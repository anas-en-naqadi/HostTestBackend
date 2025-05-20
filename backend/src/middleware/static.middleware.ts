import express from 'express';
import path from 'path';

// Create static file middleware
export const setupStaticMiddleware = (app: express.Application) => {
  // Serve static files from uploads directory
  const uploadsPath = path.join(__dirname, '../../uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  console.log(`Static file middleware configured for path: ${uploadsPath}`);
};
