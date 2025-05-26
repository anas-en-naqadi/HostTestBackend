import express from 'express';
import {
  getDashboardStatsController,
  getPerformanceDataController,
  getPopularCoursesController,
  getDashboardDataController
} from '../controllers/admin_dashboard';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = express.Router();

// Individual endpoints
router.get('/stats', authenticate, hasRole(UserRole.ADMIN), hasPermission('dashboard:admin_access'), (req, res) => {
  getDashboardStatsController(req, res);
});

router.get('/performance', authenticate, hasRole(UserRole.ADMIN), hasPermission('dashboard:admin_access'), (req, res) => {
  getPerformanceDataController(req, res);
});

router.get('/popular-courses', authenticate, hasRole(UserRole.ADMIN), hasPermission('dashboard:admin_access'), (req, res) => {
  getPopularCoursesController(req, res);
});

// Combined endpoint for all dashboard data
router.get('/data', authenticate, hasRole(UserRole.ADMIN), hasPermission('dashboard:admin_access'), (req, res) => {
  getDashboardDataController(req, res);
});

export default router;