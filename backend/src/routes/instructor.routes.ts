import { Router } from 'express';
import { getInstructorByIdController, listInstructorsController, updateInstructorController } from '../controllers/instructor';
import { validate } from '../middleware/validator.middleware';
import {  updateInstructorSchema } from '../validation/instructor.validation';
import { authenticate,hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/auth.types';


const router = Router();
router.use(authenticate,hasRole(UserRole.ADMIN));

router.get('/', listInstructorsController);
router.get('/:id', getInstructorByIdController);
router.put('/:id', validate(updateInstructorSchema, 'body'), updateInstructorController);


export default router;