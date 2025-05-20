// src/services/dashboard/stats.service.ts
import { PrismaClient } from '@prisma/client';
import { DashboardStatsResponse } from '../../types/dashboard.types';

const prisma = new PrismaClient();

export const getDashboardStats = async (userId: number): Promise<DashboardStatsResponse> => {
  // Get counts from database
  const [
    trainersCount,
    instructorsCount,
    coursesCount,
    categoriesCount,
    activeInternsCount,
    activeInstructorsCount
  ] = await Promise.all([
    prisma.users.count({
      where: {
        roles: {
          name: "intern"
        },
        status: "active"
      }
    }),
    prisma.instructors.count(),
    prisma.courses.count({
      where: {
        is_published: true
      }
    }),
    prisma.categories.count(),
    // Online interns (excluding current user)
    prisma.users.count({
      where: {
        NOT: { id: userId },
        roles: { name: 'intern' },
        is_online: true,
      },
    }),
    // Online instructors (excluding current user)
    prisma.users.count({
      where: {
        NOT: { id: userId },
        roles: { name: 'instructor' },
        is_online: true,
      },
    }),
  ]);

  const stats: DashboardStatsResponse = {
    trainers: trainersCount,
    instructors: instructorsCount,
    courses: coursesCount,
    categories: categoriesCount,
    activeInterns: activeInternsCount,
    activeInstructors: activeInstructorsCount
  };

  return stats;
};