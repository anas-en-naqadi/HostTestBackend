// src/routes/notes.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { createNoteController } from '../controllers/notes/create.controller';
import { updateNoteController } from '../controllers/notes/update.controller';
import { removeNoteController } from '../controllers/notes/remove.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]));
// Apply authentication middleware to all notes routes
router.post('/', hasPermission('note:create'), createNoteController);
router.put('/:id', hasPermission('note:update'), updateNoteController);
router.delete('/:id', hasPermission('note:delete'), removeNoteController);

export default router;