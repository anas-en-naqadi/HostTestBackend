import Router from 'express';
import { listCoursesController,getCourseBySlugController,removeCourseBySlugController,getCourseBySlugACController } from '../controllers/course';
import { createCourseController } from '../controllers/course/create.controller';
import { updateCourseController } from '../controllers/course/update.controller';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import { validateSlug } from '../middleware/validator.middleware';
import { validate } from '../middleware/validator.middleware';
import { createCourseSchema } from '../validation/course.validation';
import { updateCourseSchema } from '../validation/course.validation';
const router = Router();

router.use(authenticate,hasRole(UserRole.INSTRUCTOR));
router.get('/',hasRole([UserRole.ADMIN,UserRole.INSTRUCTOR]), listCoursesController);
router.get('/:slug',validateSlug, getCourseBySlugController);
router.get('/about-course/:slug',validateSlug, getCourseBySlugACController);
router.delete('/:slug',validateSlug, removeCourseBySlugController);
router.post('/', validate(createCourseSchema,'body'), createCourseController);
router.put('/:slug',validateSlug,validate(updateCourseSchema,'body'), updateCourseController);


export default router;
