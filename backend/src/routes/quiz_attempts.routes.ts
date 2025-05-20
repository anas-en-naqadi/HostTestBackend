// src/routes/quiz-attempts.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { createQuizAttemptController } from '../controllers/quiz-attempts/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

// Apply authentication middleware to all quiz-attempts routes
router.post('/', authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]), hasPermission('quiz:read'), createQuizAttemptController);

export default router;