// src/routes/quiz-attempts.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listQuizAttemptsController } from '../controllers/quiz-attempts/list.controller';
import { createQuizAttemptController } from '../controllers/quiz-attempts/create.controller';
import { updateQuizAttemptController } from '../controllers/quiz-attempts/update.controller';
import { removeQuizAttemptController } from '../controllers/quiz-attempts/remove.controller';
import { getQuizAttemptByIdController } from '../controllers/quiz-attempts/getById.controller';

const router = Router();

// Apply authentication middleware to all quiz-attempts routes
router.get('/quiz-attempts', authenticate, listQuizAttemptsController);
router.post('/quiz-attempts', authenticate, createQuizAttemptController);
router.put('/quiz-attempts/:id', authenticate, updateQuizAttemptController);
router.delete('/quiz-attempts/:id', authenticate, removeQuizAttemptController);
router.get('/quiz-attempts/:id', authenticate, getQuizAttemptByIdController);

export default router;