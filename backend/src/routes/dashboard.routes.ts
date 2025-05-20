// src/routes/learningSections.routes.ts
import { Router } from 'express';
import { nextLearningController,fieldSuggestionsController,userDashboardStatsController, getDashboardChartDataController, getCourseFiltersController } from '../controllers/dashboard';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]));

router.get('/charts', hasPermission('dashboard:intern_access'), getDashboardChartDataController);
router.get('/next-learning', hasPermission('dashboard:intern_access'), nextLearningController);
router.get('/field-suggestions', hasPermission('dashboard:intern_access'), fieldSuggestionsController);
router.get('/stats', hasPermission('dashboard:intern_access'), userDashboardStatsController);
router.get("/filters", hasPermission('dashboard:intern_access'), getCourseFiltersController);

export default router;
