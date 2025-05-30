import express from 'express';

import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import { getInstructorDashboardStatsController,getInstructorPerformanceDataController,getInstructorPopularCoursesController } from '../controllers/instructor_dashboard';

const router = express.Router();
router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));
// Individual endpoints
router.get('/stats', hasPermission('dashboard:instructor_access'), getInstructorDashboardStatsController);

router.get('/performance', hasPermission('dashboard:instructor_access'), getInstructorPerformanceDataController);

router.get('/popular-courses', hasPermission('dashboard:instructor_access'), getInstructorPopularCoursesController);


export default router;