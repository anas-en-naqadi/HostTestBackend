
import { PrismaClient, quiz_attempts } from '@prisma/client';
import redis from '../../config/redis';


const prisma = new PrismaClient();
const getQuizAttemptsCacheKey = (userId: number) => `quiz_attempts:${userId}`;
const getQuizAttemptByIdCacheKey = (id: number) => `quiz_attempt:${id}`;

export const updateQuizAttempt = async (
  userId: number,
  id: number,
  data: { score?: number; passed?: boolean; completedAt?: Date }
): Promise<quiz_attempts> => {
  const attempt = await prisma.quiz_attempts.findUnique({
    where: { id },
    include: { quizzes: true },
  });

  if (!attempt || attempt.user_id !== userId) {
    throw new Error('Quiz attempt not found or unauthorized');
  }

  const lesson = await prisma.lessons.findFirst({
    where: { quiz_id: attempt.quiz_id },
    include: {
      modules: {
        include: {
          courses: { include: { enrollments: true } },
        },
      },
    },
  });


  const isEnrolled = lesson?.modules.courses.enrollments.some((e) => e.user_id === userId);
  if (!lesson || !isEnrolled) {
    throw new Error('Unauthorized: User not enrolled in the course');
  }

  const updatedAttempt = await prisma.quiz_attempts.update({
    where: { id },
    data: {
      score: data.score,
      passed: data.passed,
      completed_at: data.completedAt,
      updated_at: new Date(),
    },
  });

  await redis.del(getQuizAttemptsCacheKey(userId));
  await redis.del(getQuizAttemptByIdCacheKey(id));
  return updatedAttempt;
  
};
