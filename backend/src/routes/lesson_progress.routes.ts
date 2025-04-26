// src/routes/lesson-progress.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getLessonProgressController } from '../controllers/lesson-progress/list.controller';
import { postLessonProgressController } from '../controllers/lesson-progress/create.controller';
import { getLessonProgressByIdController } from '../controllers/lesson-progress/getById.controller';
import { putLessonProgressController } from '../controllers/lesson-progress/update.controller';
import { deleteLessonProgressController } from '../controllers/lesson-progress/remove.controller';

const router = Router();

// Apply authentication middleware to all lesson-progress routes
router.get('/lesson-progress', authenticate, getLessonProgressController);
router.post('/lesson-progress', authenticate, postLessonProgressController);
router.get('/lesson-progress/:lessonId', authenticate, getLessonProgressByIdController);
router.put('/lesson-progress/:lessonId', authenticate, putLessonProgressController);
router.delete('/lesson-progress/:lessonId', authenticate, deleteLessonProgressController);

export default router;