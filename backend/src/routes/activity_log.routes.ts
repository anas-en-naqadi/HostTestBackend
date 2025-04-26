import { Router } from 'express';
import { listActivityLogsController } from '../controllers/activity_log/list.controller';

const router = Router();

router.get('/', listActivityLogsController);

export default router;
