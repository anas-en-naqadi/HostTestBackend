// src/routes/certificates.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listCertificatesController } from '../controllers/certificates/list.controller';
import { createCertificateController } from '../controllers/certificates/create.controller';
import { downloadCertificateController } from '../controllers/certificates/download.controller';
import { UserRole } from '../types/user.types';

const router = Router();
router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN,UserRole.INTERN]));
// Apply authentication middleware to all certificates routes
router.get('/', hasPermission('certificate:read'), listCertificatesController);
router.post('/', hasPermission('certificate:create'), createCertificateController);
router.get('/:enrollmentId/download', hasPermission('certificate:download'), downloadCertificateController);

export default router;