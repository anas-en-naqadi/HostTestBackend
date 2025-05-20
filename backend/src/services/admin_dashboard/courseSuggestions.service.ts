// src/services/dashboard/courseSuggestions.service.ts
import { PrismaClient } from "@prisma/client";
import { PopularCourse } from "../../types/dashboard.types";

const prisma = new PrismaClient();

export const getPopularCourses = async (
  limit: number = 4
): Promise<PopularCourse[]> => {
  // Get courses with most enrollments
  const popularCourses = await prisma.courses.findMany({
    where: {
      is_published: true,
    },
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      enrollments: {
        _count: "desc",
      },
    },
    take: limit,
  });

  // Format data for frontend
  const formattedCourses: PopularCourse[] = popularCourses.map((course) => ({
    id: course.id.toString(),
    thumbnail: course.thumbnail_url,
    title: course.title,
    participants: course._count.enrollments,
  }));

  return formattedCourses;
};
