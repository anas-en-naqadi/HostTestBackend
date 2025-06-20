// src/services/dashboard/instructorStats.service.ts
import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
interface InstructorStatsResponse {
  totalCourses:     number;  // published courses
  totalStudents:    number;  // unique learners
  totalCompletions: number;  // completed enrollments
  newEnrollments:   number;  // in last 24h
  newCompletions:   number;  // in last 24h
  activeInterns?:    number;  // interns online & enrolled in this instructor’s courses
}
export const getInstructorStats = async (
  instructorId: number
): Promise<InstructorStatsResponse> => {


  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalCourses,
    totalStudents,
    totalCompletions,
    newEnrollments,
    newCompletions,
     activeInterns
  ] = await Promise.all([
    // 1) published courses
    prisma.courses.count({
      where: { instructor_id: instructorId, is_published: true }
    }),

    // 2) unique students across their courses
    prisma.$queryRaw<number[]>`
      SELECT COUNT(DISTINCT user_id)
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = ${instructorId};
    `.then(res => Number(res[0])),

    // 3) all‑time completions
    prisma.enrollments.count({
      where: {
        completed_at: { not: null },
        courses: { instructor_id: instructorId }
      }
    }),

    // 4) new enrollments last 24h
    prisma.enrollments.count({
      where: {
        enrolled_at: { gte: since24h },
        courses: { instructor_id: instructorId }
      }
    }),

    // 5) new completions last 24h
    prisma.enrollments.count({
      where: {
        completed_at: { gte: since24h },
        courses: { instructor_id: instructorId }
      }
    }),

    // 6) active interns currently online and enrolled in at least one of their courses
    prisma.users.count({
      where: {
        is_online: true,
        roles: { name: 'intern' },
        enrollments: {
          some: {
            courses: { instructor_id: instructorId }
          }
        }
      }
    })
  ]);

  const stats: InstructorStatsResponse = {
    totalCourses,
    totalStudents,
    totalCompletions,
    newEnrollments,
    newCompletions,
     activeInterns
  };

  return stats;
};
