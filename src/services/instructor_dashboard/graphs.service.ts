// src/services/dashboard/instructorPerformance.service.ts
import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
interface InstructorPerformanceData {
  week: string;            // e.g. "Apr 14–20"
  newEnrollments: number;  // how many enrolled in that week
  completions: number;     // how many completed in that week
}

/**
 * Returns per‑week data for:
 * - newEnrollments: number of users who enrolled in THIS instructor's courses
 * - completions:     number of those enrollments marked completed
 */
export const getInstructorPerformanceData = async (
  instructorId: number,
  weeks: number = 5
): Promise<InstructorPerformanceData[]> => {


  const now = new Date();
  const data: InstructorPerformanceData[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    // compute window [weekStart, weekEnd)
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 7);

    // count new enrollments in this window for courses by this instructor
    const newEnrollments = await prisma.enrollments.count({
      where: {
        enrolled_at: {
          gte: weekStart,
          lt: weekEnd,
        },
        courses: {
          instructor_id: instructorId,
        },
      },
    });

    // count completions in this window for same instructor
    const completions = await prisma.enrollments.count({
      where: {
        completed_at: {
          gte: weekStart,
          lt: weekEnd,
        },
        courses: {
          instructor_id: instructorId,
        },
      },
    });

   const weekNum = weeks - i;
    const label   = `Week ${weekNum}`;
    
    data.push({
      week: label,
      newEnrollments,
      completions,
    });
  }

  return data;
};
