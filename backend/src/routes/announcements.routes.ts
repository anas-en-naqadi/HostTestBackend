// src/routes/announcements.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listAnnouncementsController } from '../controllers/announcements/list.controller';
import { createAnnouncementController } from '../controllers/announcements/create.controller';
import { updateAnnouncementController } from '../controllers/announcements/update.controller';
import { removeAnnouncementController } from '../controllers/announcements/remove.controller';
import { getAnnouncementByIdController } from '../controllers/announcements/getById.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));

router.get('/', hasPermission('announcement:read'), listAnnouncementsController);
router.post('/', hasPermission('announcement:create'), createAnnouncementController);
router.put('/:id', hasPermission('announcement:update'), updateAnnouncementController);
router.delete('/:id', hasPermission('announcement:delete'), removeAnnouncementController);
router.get('/:id', hasPermission('announcement:read'), getAnnouncementByIdController);

export default router;