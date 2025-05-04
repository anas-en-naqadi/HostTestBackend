import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware'; // Import real authentication middleware
import { getEnrollmentsController } from '../controllers/enrollments/list.controller';
import { postEnrollmentController } from '../controllers/enrollments/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate,hasRole(UserRole.INTERN));
// Replace the mock auth middleware with the real one
router.get('/', getEnrollmentsController);
router.post('/', postEnrollmentController);

export default router;