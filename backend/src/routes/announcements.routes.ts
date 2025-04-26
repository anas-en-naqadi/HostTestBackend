// src/routes/announcements.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listAnnouncementsController } from '../controllers/announcements/list.controller';
import { createAnnouncementController } from '../controllers/announcements/create.controller';
import { updateAnnouncementController } from '../controllers/announcements/update.controller';
import { removeAnnouncementController } from '../controllers/announcements/remove.controller';
import { getAnnouncementByIdController } from '../controllers/announcements/getById.controller';

const router = Router();

// Apply authentication middleware to all announcements routes
router.get('/announcements', authenticate, listAnnouncementsController);
router.post('/announcements', authenticate, createAnnouncementController);
router.put('/announcements/:id', authenticate, updateAnnouncementController);
router.delete('/announcements/:id', authenticate, removeAnnouncementController);
router.get('/announcements/:id', authenticate, getAnnouncementByIdController);

export default router;