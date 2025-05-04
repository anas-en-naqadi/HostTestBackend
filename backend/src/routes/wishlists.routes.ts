// src/routes/wishlists.routes.ts
import { Router } from 'express';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { listWishlistsController } from '../controllers/wishlists/list.controller';
import { createWishlistController } from '../controllers/wishlists/create.controller';
import { removeWishlistController } from '../controllers/wishlists/remove.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate,hasRole(UserRole.INTERN));

router.get('/', listWishlistsController);
router.post('/', createWishlistController);
router.delete('/:courseId', removeWishlistController);

export default router;