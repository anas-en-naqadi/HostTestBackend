import Router, { RequestHandler } from 'express';
import {
  listCoursesController,
  getCourseBySlugController,
  removeCourseBySlugController,
  getCourseBySlugACController,
  listCoursesByUserController
} from '../controllers/course';
import { createCourseController } from '../controllers/course/create.controller';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { updateCourseController } from '../controllers/course/update.controller';
import { UserRole } from '../types/user.types';
import { validateSlug } from '../middleware/validator.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Base authentication for all routes
router.use(authenticate);

// Create, Update, Delete operations - restricted to instructors and admins
router.post('/',
  hasRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  hasPermission('course:create'),
  upload.any(), // Use any() to accept all fields including dynamic lesson_video_* fields
  createCourseController as RequestHandler
);

router.put('/:slug',
  hasRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  hasPermission('course:update'),
  validateSlug,
  upload.any(), // Use any() to accept all fields including dynamic lesson_video_* fields
  updateCourseController as RequestHandler
);

router.put('/:slug/json',
  hasRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  hasPermission('course:update'),
  validateSlug,
  updateCourseController as RequestHandler
);

router.delete('/:slug',
  hasRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  hasPermission('course:delete'),
  validateSlug,
  removeCourseBySlugController
);

// Read operations - accessible by all roles including interns
router.get('/about-course/:slug',
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  hasPermission('course:read'),
  validateSlug,
  getCourseBySlugACController
);

router.get('/',
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  hasPermission('course:read'),
  listCoursesController
);

// Get courses by user ID - must be placed before the /:slug route
router.get('/user',
  hasRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  hasPermission('course:read'),
  listCoursesByUserController
);

router.get('/:slug',
  hasRole([UserRole.INTERN, UserRole.ADMIN, UserRole.INSTRUCTOR]),
  hasPermission('course:read'),
  validateSlug,
  getCourseBySlugController
);

export default router;