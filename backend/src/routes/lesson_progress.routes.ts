// src/routes/lesson-progress.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { postLessonProgressController } from '../controllers/lesson-progress/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

// Apply authentication middleware to all lesson-progress routes
router.post('/', authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]), hasPermission('lesson:read'), postLessonProgressController);

export default router;