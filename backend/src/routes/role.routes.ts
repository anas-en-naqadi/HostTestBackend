import { Router } from 'express';
import { createRoleController, updateRoleController, removeRoleController, getRoleByIdController, getRolesListController, assignPermissionController } from '../controllers/role/index';
import { authenticate,hasPermission,hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import { revokePermissionController } from '../controllers/role/index';
import { assignPermissionValidation, revokePermissionValidation } from '../validation/role.validation';
import { validate } from '../middleware/validator.middleware';

const router = Router();
router.use(authenticate,hasRole(UserRole.ADMIN));

router.post('/',createRoleController); // Create a new role
router.put('/:id',updateRoleController); // Update an existing role
router.delete('/:id',removeRoleController); // Remove a role
router.get('/:id',getRoleByIdController); // Get role by ID
router.get('/',hasPermission("role:fetch"), getRolesListController); // Get all roles
router.post('/assign-permissions',validate(assignPermissionValidation,'body'),assignPermissionController);
router.post('/revoke-permissions',validate(revokePermissionValidation,'body'),revokePermissionController);
export default router;
