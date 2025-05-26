import { Router } from 'express';
import { createRoleController, updateRoleController, removeRoleController, getRoleByIdController, getRolesListController, assignPermissionController } from '../controllers/role/index';
import { authenticate,hasPermission,hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import { revokePermissionController } from '../controllers/role/index';
import { assignPermissionValidation, revokePermissionValidation } from '../validation/role.validation';
import { validate } from '../middleware/validator.middleware';

const router = Router();
router.use(authenticate, hasRole(UserRole.ADMIN));

router.post('/', hasPermission('role:create'), createRoleController); // Create a new role
router.put('/:id', hasPermission('role:update'), updateRoleController); // Update an existing role
router.delete('/:id', hasPermission('role:delete'), removeRoleController); // Remove a role
router.get('/:id', hasPermission('role:read'), getRoleByIdController); // Get role by ID
router.get('/', hasPermission('role:read'), getRolesListController); // Get all roles
router.post('/assign-permissions', hasPermission('permission:assign'), validate(assignPermissionValidation,'body'), assignPermissionController);
router.post('/revoke-permissions', hasPermission('permission:revoke'), validate(revokePermissionValidation,'body'), revokePermissionController);

export default router;
