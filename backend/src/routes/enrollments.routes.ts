import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware'; // Import real authentication middleware
import { getEnrollmentsController } from '../controllers/enrollments/list.controller';
import { postEnrollmentController } from '../controllers/enrollments/create.controller';
import { UserRole } from '../types/user.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course enrollment management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         courseId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     EnrollmentWithCourse:
 *       type: object
 *       properties:
 *         courseTitle:
 *           type: string
 *         instructorName:
 *           type: string
 *         progressPercent:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         courseThumbnail:
 *           type: string
 *           format: uri
 *         completedLessons:
 *           type: integer
 *         totalLessons:
 *           type: integer
 *         courseSlug:
 *           type: string
 *         courseSubTitle:
 *           type: string
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         currentPage:
 *           type: integer
 *         limit:
 *           type: integer
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

router.use(authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]));

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get user's course enrollments
 *     description: Retrieve paginated list of courses the authenticated user is enrolled in with progress data
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of enrollments with progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrollmentWithCourse'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/', hasPermission('enrollment:read'), getEnrollmentsController);

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Enroll in a course
 *     description: Create a new course enrollment for the authenticated user
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: integer
 *                 description: ID of the course to enroll in
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Bad request - Invalid course ID
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal server error
 */
router.post('/', hasPermission('enrollment:create'), postEnrollmentController);

export default router;