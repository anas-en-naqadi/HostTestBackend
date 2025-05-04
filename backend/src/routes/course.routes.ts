import Router from 'express';
import { 
  listCoursesController,
  getCourseBySlugController,
  removeCourseBySlugController,
  getCourseBySlugACController 
} from '../controllers/course';
import { createCourseController } from '../controllers/course/create.controller';
import { updateCourseController } from '../controllers/course/update.controller';
import { authenticate, hasRole } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';
import { validateSlug, validate } from '../middleware/validator.middleware';
import { createCourseSchema, updateCourseSchema } from '../validation/course.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create, Update, Delete operations
router.post('/', 
  hasRole(UserRole.INSTRUCTOR),
  validate(createCourseSchema, 'body'), 
  createCourseController
);

router.put('/:slug', 
  hasRole(UserRole.INSTRUCTOR),
  validateSlug,
  validate(updateCourseSchema, 'body'),
  updateCourseController
);

router.delete('/:slug',
  hasRole(UserRole.INSTRUCTOR), 
  validateSlug, 
  removeCourseBySlugController
);

// Routes that interns, admins, and instructors can access
// Read operations
router.get('/about-course/:slug',
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  validateSlug, 
  getCourseBySlugACController
);

router.get('/', 
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  listCoursesController
);

router.get('/:slug',
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  validateSlug, 
  getCourseBySlugController
);

export default router;