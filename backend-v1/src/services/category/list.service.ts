// src/services/category/list.service.ts
import { PrismaClient } from "@prisma/client";
import { CategoryResponse } from "../../types/category.types";

const prisma = new PrismaClient();

interface CategoryResult {
  data: CategoryResponse[];
}

interface ListCategoriesParams {
  sortBy?: "name" | "courseCount";
  sortOrder?: "asc" | "desc";
}

// Define the type for the Prisma query result
type CategoryWithCount = {
  id: number;
  name: string;
  slug: string;
  users: {
    full_name: string;
  };
  created_by: number;
  _count: {
    courses: number;
  };
};

export const listCategories = async ({
  sortBy = "name",
  sortOrder = "asc",
  userId,
  roleId,
}: ListCategoriesParams & {
  userId: number;
  roleId: number;
}): Promise<CategoryResult> => {
  try {
    // Build orderBy clause
    const orderBy =
      sortBy === "courseCount"
        ? { _count: { courses: sortOrder } }
        : { [sortBy]: sortOrder };

    // Add where clause based on role
    //  const where = roleId === 1 ? {} : { created_by: userId };
    const where = {};

    const categories = (await prisma.categories.findMany({
      where, // Add this filter
      orderBy,
      select: {
        id: true,
        name: true,
        slug: true,
        created_by: true,
        users: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: { courses: true },
        },
      },
    })) as CategoryWithCount[];

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      createdBy: category.created_by, // Add this
      creatorName: category.users.full_name,
      courseCount: category._count.courses,
    }));

    return { data: formattedCategories };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch categories: ${message}`);
  } finally {
    await prisma.$disconnect();
  }
};
