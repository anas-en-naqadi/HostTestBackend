import { Router } from 'express';
import { listNotificationsController } from '../controllers/notification/list.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/',authenticate, listNotificationsController);

export default router;
