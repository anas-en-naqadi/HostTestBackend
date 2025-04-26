// src/routes/notes.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listNotesController } from '../controllers/notes/list.controller';
import { createNoteController } from '../controllers/notes/create.controller';
import { updateNoteController } from '../controllers/notes/update.controller';
import { removeNoteController } from '../controllers/notes/remove.controller';
import { getNoteByIdController } from '../controllers/notes/getById.controller';

const router = Router();

// Apply authentication middleware to all notes routes
router.get('/notes', authenticate, listNotesController);
router.post('/notes', authenticate, createNoteController);
router.put('/notes/:id', authenticate, updateNoteController);
router.delete('/notes/:id', authenticate, removeNoteController);
router.get('/notes/:id', authenticate, getNoteByIdController);

export default router;