// src/routes/wishlists.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listWishlistsController } from '../controllers/wishlists/list.controller';
import { createWishlistController } from '../controllers/wishlists/create.controller';
import { removeWishlistController } from '../controllers/wishlists/remove.controller';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]));

router.get('/', hasPermission('wishlist:manage'), listWishlistsController);
router.post('/', hasPermission('wishlist:manage'), createWishlistController);
router.delete('/:courseId', hasPermission('wishlist:manage'), removeWishlistController);

export default router;