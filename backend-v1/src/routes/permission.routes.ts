import express from 'express';
import { listPermissionsController, getPermissionByIdController } from '../controllers/permission/list.controller';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = express.Router();

// Get all permissions
router.get('/', authenticate, hasRole(UserRole.ADMIN), hasPermission('role:read'), listPermissionsController);

// Get permission by ID
router.get('/:id', authenticate, hasRole(UserRole.ADMIN), hasPermission('role:read'), getPermissionByIdController);

export default router;
