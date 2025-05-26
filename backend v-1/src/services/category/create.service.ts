// src/services/category/create.service.ts

import { PrismaClient, Prisma } from "@prisma/client";
import slugify from "slugify";
import { AppError } from "../../middleware/error.middleware";
import {
  CreateCategoryDto,
  CategoryResponse,
} from "../../types/category.types";
import {
  CACHE_KEYS,
  deleteFromCache,
  generateCacheKey,
} from "../../utils/cache.utils";
const prisma = new PrismaClient();

/**
 * Create a new category (slug auto‑generated)
 */
export const createCategory = async (
  dto: CreateCategoryDto,
  userId: number
): Promise<CategoryResponse> => {
  const slug = slugify(dto.name, { lower: true, strict: true });

  try {
    const category = await prisma.categories.create({
      data: { name: dto.name, slug, created_by: userId },
      select: { id: true, name: true, slug: true },
    });

    const courses = await prisma.courses.findMany({
      select: { slug: true },
      where: {
        category_id: category.id,
      },
    });

    await Promise.all(
      courses.map((course) =>
        deleteFromCache(
          generateCacheKey(CACHE_KEYS.COURSE, `learn-${course.slug}`)
        )
      )
    );

    return category;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(409, "Category with this name already exists");
    }
    throw new AppError(500, "Could not create category");
  }
};
