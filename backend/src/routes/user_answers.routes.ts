// src/routes/user-answers.routes.ts
import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { createUserAnswerController } from '../controllers/user-answers/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.post('/user-answers', authenticate,hasRole(UserRole.INTERN), createUserAnswerController);

export default router;