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
import { authenticate, hasRole } from "../middleware/auth.middleware";
import { validate, validateSlug } from "../middleware/validator.middleware";
import { UserRole } from "../types/auth.types";

const router = Router();
router.use(authenticate, hasRole(UserRole.INSTRUCTOR));
router.post(
  "/",
  validate(createCategorySchema, "body"),
  createCategoryController
);

router.get("/", listCategoriesController);

router.get(
  "/:slug",
  validateSlug,
  validate(getCategorySchema, "params"),
  getCategoryBySlugController
);

router.put(
  "/:slug",
  validateSlug,
  validate(updateCategorySchema, "body"),
  updateCategoryController
);

router.delete(
  "/:slug",
  validateSlug,
  validate(getCategorySchema, "params"),
  removeCategoryController
);

export default router;
