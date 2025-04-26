import { Router} from 'express';
import { validate } from '../middleware/validator.middleware';
import { 
  listUsersController, 
  getUserByIdController, 
  createUserController, 
  updateProfileController, 
  removeUserController 
} from '../controllers/user';
import { createUserSchema,updateProfileSchema } from '../validation/user.validation';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
router.use(authenticate,hasRole(UserRole.ADMIN));

// User routes
router.get('/',  listUsersController);

router.get('/:id',  getUserByIdController);

router.post('/',validate(createUserSchema,'body'), createUserController);

router.delete('/:id',  removeUserController);

 router.put('/profile/update/:id',hasRole([UserRole.INSTRUCTOR,UserRole.INTERN,UserRole.ADMIN]),validate(updateProfileSchema,'body'),  updateProfileController);

export default router;
