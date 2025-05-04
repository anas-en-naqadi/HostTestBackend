// src/routes/notes.routes.ts
import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { listNotesController } from '../controllers/notes/list.controller';
import { createNoteController } from '../controllers/notes/create.controller';
import { updateNoteController } from '../controllers/notes/update.controller';
import { removeNoteController } from '../controllers/notes/remove.controller';
import { getNoteByIdController } from '../controllers/notes/getById.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate,hasRole(UserRole.INTERN));
// Apply authentication middleware to all notes routes
router.get('/', listNotesController);
router.post('/', createNoteController);
router.put('/:id', updateNoteController);
router.delete('/:id', removeNoteController);
router.get('/:id', getNoteByIdController);

export default router;