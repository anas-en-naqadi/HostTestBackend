import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware'; // Import real authentication middleware
import { getEnrollmentsController } from '../controllers/enrollments/list.controller';
import { postEnrollmentController } from '../controllers/enrollments/create.controller';
import { getEnrollmentByIdController } from '../controllers/enrollments/getById.controller';
import { putEnrollmentController } from '../controllers/enrollments/update.controller';
import { deleteEnrollmentController } from '../controllers/enrollments/remove.controller';

const router = Router();

// Replace the mock auth middleware with the real one
router.get('/enrollments', authenticate, getEnrollmentsController);
router.post('/enrollments', authenticate, postEnrollmentController);
router.get('/enrollments/:id', authenticate, getEnrollmentByIdController);
router.put('/enrollments/:id', authenticate, putEnrollmentController);
router.delete('/enrollments/:id', authenticate, deleteEnrollmentController);

export default router;