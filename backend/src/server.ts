// server.ts
import { loadEnv } from './config/env';
import app from './app';
import { logger } from './middleware/logging.middleware';
import { scheduleCleanupJobs } from './jobs/cleanup.jobs';

// Load environment variables
loadEnv();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`✅ Server is running on port ${PORT}`);
  logger.info(`🌱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  logger.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
  logger.info(`🔐 JWT Refresh Secret: ${process.env.JWT_REFRESH_SECRET ? 'Configured' : 'Not configured'}`);

  // Schedule the cleanup jobs to run
  scheduleCleanupJobs();
});
