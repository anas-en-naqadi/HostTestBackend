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
router.use(authenticate, hasRole([UserRole.INSTRUCTOR,UserRole.ADMIN]));
router.post(
  "/",
  hasPermission('category:create'),
  validate(createCategorySchema, "body"),
  createCategoryController
);

router.get("/", hasPermission('category:read'), listCategoriesController);

router.get(
  "/:slug",
  hasPermission('category:read'),
  validateSlug,
  validate(getCategorySchema, "params"),
  getCategoryBySlugController
);

router.put(
  "/:slug",
  hasPermission('category:update'),
  validateSlug,
  validate(updateCategorySchema, "body"),
  updateCategoryController
);

router.delete(
  "/:slug",
  hasPermission('category:delete'),
  validateSlug,
  validate(getCategorySchema, "params"),
  removeCategoryController
);

export default router;
