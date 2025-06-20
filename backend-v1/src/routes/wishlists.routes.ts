// src/routes/wishlists.routes.ts
import { Router } from 'express';
import { authenticate, hasRole, hasPermission } from '../middleware/auth.middleware';
import { listWishlistsController } from '../controllers/wishlists/list.controller';
import { createWishlistController } from '../controllers/wishlists/create.controller';
import { removeWishlistController } from '../controllers/wishlists/remove.controller';
import { UserRole } from '../types/user.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: User wishlist management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         course_id:
 *           type: integer
 *         main_course_id:
 *           type: integer
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         course:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             thumbnail_url:
 *               type: string
 *             price:
 *               type: number
 *               format: float
 *             duration:
 *               type: integer
 *             level:
 *               type: string
 * 
 *     CreateWishlistRequest:
 *       type: object
 *       required:
 *         - course_id
 *       properties:
 *         course_id:
 *           type: integer
 *           description: ID of the course to add to wishlist
 *         main_course_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the main course (optional)
 * 
 *     RemoveWishlistRequest:
 *       type: object
 *       properties:
 *         main_course_id:
 *           type: integer
 *           nullable: true
 *           description: ID of the main course (optional)
 * 
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         totalCount:
 *           type: integer
 *           description: Total number of wishlist items
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         currentPage:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 * 
 *     WishlistListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Wishlist'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 * 
 *     WishlistCreateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Wishlist'
 * 
 *     WishlistRemoveResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: null
 */

router.use(authenticate, hasRole([UserRole.INTERN,UserRole.INSTRUCTOR,UserRole.ADMIN]));

/**
 * @swagger
 * /api/wishlists:
 *   get:
 *     summary: List user's wishlist
 *     description: Retrieve all courses in the authenticated user's wishlist with pagination
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistListResponse'
 *             example:
 *               success: true
 *               message: "Wishlist retrieved successfully"
 *               data:
 *                 - id: 1
 *                   user_id: 123
 *                   course_id: 456
 *                   main_course_id: null
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                   course:
 *                     id: 456
 *                     title: "JavaScript Fundamentals"
 *                     description: "Learn the basics of JavaScript"
 *                     thumbnail_url: "https://example.com/thumb.jpg"
 *                     price: 99.99
 *                     duration: 120
 *                     level: "Beginner"
 *               pagination:
 *                 totalCount: 15
 *                 totalPages: 3
 *                 currentPage: 1
 *                 limit: 6
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', hasPermission('wishlist:manage'), listWishlistsController);

/**
 * @swagger
 * /api/wishlists:
 *   post:
 *     summary: Add course to wishlist
 *     description: Add a course to the authenticated user's wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWishlistRequest'
 *           example:
 *             course_id: 456
 *             main_course_id: 789
 *     responses:
 *       201:
 *         description: Course added to wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistCreateResponse'
 *             example:
 *               success: true
 *               message: "Course added to wishlist successfully"
 *               data:
 *                 id: 1
 *                 user_id: 123
 *                 course_id: 456
 *                 main_course_id: 789
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request (invalid or missing course_id)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Valid course ID is required"
 *                 data:
 *                   type: null
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', hasPermission('wishlist:manage'), createWishlistController);

/**
 * @swagger
 * /api/wishlists/{courseId}:
 *   delete:
 *     summary: Remove course from wishlist
 *     description: Remove a course from the authenticated user's wishlist
 *     tags: [Wishlists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the course to remove from wishlist
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveWishlistRequest'
 *           example:
 *             main_course_id: 789
 *     responses:
 *       200:
 *         description: Course removed from wishlist successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WishlistRemoveResponse'
 *             example:
 *               success: true
 *               message: "Course removed from wishlist successfully"
 *               data: null
 *       400:
 *         description: Bad request (invalid course ID)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid course ID"
 *                 data:
 *                   type: null
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wishlist item not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:courseId', hasPermission('wishlist:manage'), removeWishlistController);

export default router;