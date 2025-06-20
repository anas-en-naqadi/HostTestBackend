// src/services/category/update.service.ts

import { PrismaClient, Prisma } from "@prisma/client";
import slugify from "slugify";
import { AppError } from "../../middleware/error.middleware";
import {
  UpdateCategoryDto,
  CategoryResponse,
} from "../../types/category.types";
import { CACHE_KEYS, deleteFromCache, deletePatternFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();

/**
 * Update a category’s name (and slug)
 */
export const updateCategory = async (
  slug: string,
  dto: UpdateCategoryDto,
  userId: number
): Promise<CategoryResponse> => {
  const data: Record<string, any> = {};
  if (dto.name) {
    data.name = dto.name;
    data.slug = slugify(dto.name, { lower: true, strict: true });
  }

  try {
    const category = await prisma.categories.update({
      where: { slug: slug },
      data,
      select: { id: true, name: true, slug: true },
    });

    // First fetch all courses in this category
    const courses = await prisma.courses.findMany({
      where: { category_id: category.id },
      select: { slug: true }
    });

    // Delete cache for each related course
    await Promise.all(
      courses.map(course => 
        deletePatternFromCache(generateCacheKey(CACHE_KEYS.COURSE, `learn-${course.slug}-*`))
      )
    );

    return category;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new AppError(404, "Category not found");
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new AppError(409, "Category with this name already exists");
    }
    throw new AppError(500, "Could not update category");
  }
};
