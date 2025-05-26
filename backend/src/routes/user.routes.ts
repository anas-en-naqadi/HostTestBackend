import { Router} from 'express';
import { validate } from '../middleware/validator.middleware';
import { 
  listUsersController, 
  getUserByIdController, 
  createUserController, 
  updateProfileController, 
  removeUserController, 
  changeStatusController,
  updateUserController
} from '../controllers/user';
import { createUserSchema,updateProfileSchema,UserUpdateSchema } from '../validation/user.validation';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
router.use(authenticate);
router.put('/profile/update/:id', hasRole([UserRole.INSTRUCTOR,UserRole.INTERN,UserRole.ADMIN]), hasPermission('profile:update'), validate(updateProfileSchema,'body'), updateProfileController);
router.get('/:id', hasRole([UserRole.INSTRUCTOR,UserRole.INTERN,UserRole.ADMIN]), hasPermission('user:read'), getUserByIdController);
router.put('/:id', hasRole(UserRole.ADMIN), hasPermission('user:update'), validate(UserUpdateSchema,'body'), updateUserController);
router.use(hasRole(UserRole.ADMIN));

// User routes
router.get('/', hasPermission('user:read'), listUsersController);
router.post('/', hasPermission('user:create'), validate(createUserSchema,'body'), createUserController);
router.post('/change-status', hasPermission('user:manage_status'), changeStatusController);

router.delete('/:id', hasPermission('user:delete'), removeUserController);


export default router;
