// src/routes/user-answers.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { createUserAnswerController } from '../controllers/user-answers/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.post('/user-answers', authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]), hasPermission('quiz:read'), createUserAnswerController);

export default router;