// src/routes/certificates.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listCertificatesController } from '../controllers/certificates/list.controller';
import { createCertificateController } from '../controllers/certificates/create.controller';
import { updateCertificateController } from '../controllers/certificates/update.controller';
import { removeCertificateController } from '../controllers/certificates/remove.controller';
import { getCertificateByIdController } from '../controllers/certificates/getById.controller';

const router = Router();

// Apply authentication middleware to all certificates routes
router.get('/certificates', authenticate, listCertificatesController);
router.post('/certificates', authenticate, createCertificateController);
router.put('/certificates/:id', authenticate, updateCertificateController);
router.delete('/certificates/:id', authenticate, removeCertificateController);
router.get('/certificates/:id', authenticate, getCertificateByIdController);

export default router;