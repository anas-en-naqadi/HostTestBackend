// src/routes/user-answers.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listUserAnswersController } from '../controllers/user-answers/list.controller';
import { createUserAnswerController } from '../controllers/user-answers/create.controller';
import { updateUserAnswerController } from '../controllers/user-answers/update.controller';
import { removeUserAnswerController } from '../controllers/user-answers/remove.controller';
import { getUserAnswerByIdController } from '../controllers/user-answers/getById.controller';

const router = Router();

// Apply authentication middleware to all user-answers routes
router.get('/user-answers', authenticate, listUserAnswersController);
router.post('/user-answers', authenticate, createUserAnswerController);
router.put('/user-answers/:attemptId/:questionId', authenticate, updateUserAnswerController);
router.delete('/user-answers/:attemptId/:questionId', authenticate, removeUserAnswerController);
router.get('/user-answers/:attemptId/:questionId', authenticate, getUserAnswerByIdController);

export default router;