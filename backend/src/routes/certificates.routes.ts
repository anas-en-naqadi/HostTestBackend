// src/routes/certificates.routes.ts
import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { listCertificatesController } from '../controllers/certificates/list.controller';
import { createCertificateController } from '../controllers/certificates/create.controller';
import { updateCertificateController } from '../controllers/certificates/update.controller';
import { removeCertificateController } from '../controllers/certificates/remove.controller';
import { getCertificateByIdController } from '../controllers/certificates/getById.controller';
import { UserRole } from '../types/user.types';

const router = Router();
router.use(authenticate,hasRole(UserRole.INSTRUCTOR));
// Apply authentication middleware to all certificates routes
router.get('/', listCertificatesController);
router.post('/', createCertificateController);
router.put('/:id', updateCertificateController);
router.delete('/:id', removeCertificateController);
router.get('/:id',hasRole([UserRole.INTERN,UserRole.INSTRUCTOR]), getCertificateByIdController);

export default router;