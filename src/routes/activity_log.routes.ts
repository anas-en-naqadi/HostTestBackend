import { Router } from 'express';
import { listActivityLogsController } from '../controllers/activity_log/list.controller';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

router.get('/', authenticate, hasRole(UserRole.ADMIN), hasPermission('activity_log:view'), listActivityLogsController);

export default router;
