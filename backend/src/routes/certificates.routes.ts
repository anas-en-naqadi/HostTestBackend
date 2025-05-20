// src/routes/certificates.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listCertificatesController } from '../controllers/certificates/list.controller';
import { createCertificateController } from '../controllers/certificates/create.controller';
import { updateCertificateController } from '../controllers/certificates/update.controller';
import { removeCertificateController } from '../controllers/certificates/remove.controller';
import { getCertificateByIdController } from '../controllers/certificates/getById.controller';
import { UserRole } from '../types/user.types';

const router = Router();
router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));
// Apply authentication middleware to all certificates routes
router.get('/', hasPermission('certificate:read'), listCertificatesController);
router.post('/', hasPermission('certificate:create'), createCertificateController);
router.put('/:id', hasPermission('certificate:update'), updateCertificateController);
router.delete('/:id', hasPermission('certificate:delete'), removeCertificateController);
router.get('/:id', hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]), hasPermission('certificate:read'), getCertificateByIdController);

export default router;