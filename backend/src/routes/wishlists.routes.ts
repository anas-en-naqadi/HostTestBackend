// src/routes/wishlists.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { listWishlistsController } from '../controllers/wishlists/list.controller';
import { createWishlistController } from '../controllers/wishlists/create.controller';
import { updateWishlistController } from '../controllers/wishlists/update.controller';
import { removeWishlistController } from '../controllers/wishlists/remove.controller';
import { getWishlistByIdController } from '../controllers/wishlists/getById.controller';

const router = Router();

// Apply authentication middleware to all wishlists routes
router.get('/wishlists', authenticate, listWishlistsController);
router.post('/wishlists', authenticate, createWishlistController);
router.put('/wishlists/:courseId', authenticate, updateWishlistController);
router.delete('/wishlists/:courseId', authenticate, removeWishlistController);
router.get('/wishlists/:courseId', authenticate, getWishlistByIdController);

export default router;