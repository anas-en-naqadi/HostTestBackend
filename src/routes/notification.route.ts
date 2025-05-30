import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { markAllAsReadController,removeAllReadController,listNotificationsController } from '../controllers/notification';
const router = Router();

router.use(authenticate);

router.get('/', listNotificationsController);
router.post('/read-all', markAllAsReadController);
router.post('/remove-all', removeAllReadController);

export default router;
