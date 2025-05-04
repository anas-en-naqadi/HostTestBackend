// src/routes/announcements.routes.ts
import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { listAnnouncementsController } from '../controllers/announcements/list.controller';
import { createAnnouncementController } from '../controllers/announcements/create.controller';
import { updateAnnouncementController } from '../controllers/announcements/update.controller';
import { removeAnnouncementController } from '../controllers/announcements/remove.controller';
import { getAnnouncementByIdController } from '../controllers/announcements/getById.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate,hasRole([UserRole.INSTRUCTOR]));

router.get('/', listAnnouncementsController);
router.post('/', createAnnouncementController);
router.put('/:id', updateAnnouncementController);
router.delete('/:id', removeAnnouncementController);
router.get('/:id', getAnnouncementByIdController);

export default router;