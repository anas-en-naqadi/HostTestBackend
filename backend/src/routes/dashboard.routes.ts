// src/routes/learningSections.routes.ts
import { Router } from 'express';
import { nextLearningController,fieldSuggestionsController,userDashboardStatsController, getDashboardChartDataController, getCourseFiltersController } from '../controllers/dashboard';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate,hasRole(UserRole.INTERN));

router.get('/charts', getDashboardChartDataController);
router.get('/next-learning', nextLearningController);
router.get('/field-suggestions', fieldSuggestionsController);
router.get('/stats', userDashboardStatsController);
router.get("/filters", getCourseFiltersController);

export default router;
