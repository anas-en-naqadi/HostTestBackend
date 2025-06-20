// src/routes/category.routes.ts

import { Router } from "express";
import {
  createCategoryController,
  getCategoryBySlugController,
  listCategoriesController,
  removeCategoryController,
  updateCategoryController,
} from "../controllers/category";
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
} from "../validation/category.validation";
import { authenticate, hasRole, hasPermission } from "../middleware/auth.middleware";
import { validate, validateSlug } from "../middleware/validator.middleware";
import { UserRole } from "../types/auth.types";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Course category management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Web Development"
 *         slug:
 *           type: string
 *           example: "web-development"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 * 
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 * 
 *     CategorySortOptions:
 *       type: string
 *       enum: [name, courseCount]
 *       default: name
 * 
 *     CategorySortOrder:
 *       type: string
 *       enum: [asc, desc]
 *       default: asc
 */

router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Create a new course category (Admin/Instructor only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Web Development"
 *     responses:
 *       201:
 *         description: Category created successfully
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
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin/instructor role)
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",
  hasPermission('category:create'),
  validate(createCategorySchema, "body"),
  createCategoryController
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     description: Retrieve a list of all course categories with optional sorting
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema:
 *           $ref: '#/components/schemas/CategorySortOptions'
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           $ref: '#/components/schemas/CategorySortOrder'
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", hasPermission('category:read'), listCategoriesController);

/**
 * @swagger
 * /api/categories/{slug}:
 *   get:
 *     summary: Get category by slug
 *     description: Retrieve a single category by its slug
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Category details
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
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid slug format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:slug",
  hasPermission('category:read'),
  validateSlug,
  validate(getCategorySchema, "params"),
  getCategoryBySlugController
);


/**
 * @swagger
 * /api/categories/{slug}:
 *   put:
 *     summary: Update a category
 *     description: Update an existing category (Admin/Instructor only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Category Name"
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin/instructor role)
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:slug",
  hasPermission('category:update'),
  validateSlug,
  validate(updateCategorySchema, "body"),
  updateCategoryController
);


/**
 * @swagger
 * /api/categories/{slug}:
 *   delete:
 *     summary: Delete a category
 *     description: Delete a category (Admin/Instructor only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid slug format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (requires admin/instructor role)
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:slug",
  hasPermission('category:delete'),
  validateSlug,
  validate(getCategorySchema, "params"),
  removeCategoryController
);

export default router;
