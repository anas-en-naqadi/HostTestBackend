// app.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import { RequestHandler } from 'express';
import { AppError, errorHandler } from './middleware/error.middleware';
import { sanitizeRequest } from './middleware/sanitization.middleware';
import { logSecurityEvent } from './middleware/logging.middleware';
import { loadEnv } from './config/env';
import { successResponse } from './utils/api.utils';
import { initVerificationCron } from './jobs/verificationCron';

import setupSwagger from './docs/swagger';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import dashboardRoutes from './routes/dashboard.routes';
import categoryRoutes from './routes/category.routes';
import roleRoutes from './routes/role.routes';
import permissionRoutes from './routes/permission.routes';
import uploadRoutes from './routes/upload.routes';
import activityLogRoutes from './routes/activity_log.routes';
import notificationRoutes from './routes/notification.route';
import courseRoutes from './routes/course.routes';
import prisma from './config/prisma';
import redis from './config/redis';
import enrollmentRoutes from './routes/enrollments.routes'; // Updated path
import lessonProgressRoutes from './routes/lesson_progress.routes';
import quizManagementRoutes from './routes/quiz-management.routes';
import quizAttemptRoutes from './routes/quiz_attempts.routes';
import userAnswerRoutes from './routes/user_answers.routes';
import notesRoutes from './routes/notes.routes';
import announcementsRoutes from './routes/announcements.routes';
import certificatesRoutes from './routes/certificates.routes';
import wishlistsRoutes from './routes/wishlists.routes';
import AdminDashboardRoutes from './routes/admin_dashboard.routes';
import instructorDashboardRoutes from './routes/instructor_dashboard.routes'

loadEnv();
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
  exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length']
}));
app.use(cookieParser()); 
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common'));

//cron to delete unverified users
initVerificationCron();
// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request sanitization
app.use(sanitizeRequest);

// Logging
app.use(logSecurityEvent);

// Setup static file serving for uploads
import { setupStaticMiddleware } from './middleware/static.middleware';
setupStaticMiddleware(app);

// Rate limiting (auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh-token', authLimiter);

// Health Check
app.get('/health', (async (_: Request, res: Response, next: NextFunction) => {
  try {
    // Check Redis connection
    try {
      await redis.ping();
    } catch (error) {
      throw new AppError(503, 'Redis connection failed');
    }

    // Check Database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      throw new AppError(503, 'Database connection failed');
    }

    return successResponse(res, {
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructor/dashboard', instructorDashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/enrollments',     enrollmentRoutes);
app.use('/api/lesson-progress', lessonProgressRoutes);
app.use('/api/quizzes',         quizManagementRoutes);
app.use('/api/quiz-attempts',   quizAttemptRoutes);
app.use('/api/answers',         userAnswerRoutes);
app.use('/api/notes',           notesRoutes);
app.use('/api/announcements',   announcementsRoutes);
app.use('/api/certificates',    certificatesRoutes);
app.use('/api/wishlists',       wishlistsRoutes);
app.use('/api/AdminDashboard', AdminDashboardRoutes);
setupSwagger(app);
// not found route handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});


// Error handling middleware
app.use(errorHandler);

export default app;
