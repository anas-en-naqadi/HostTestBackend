import { PrismaClient, quiz_attempts } from '@prisma/client';
import redis from '../../config/redis';


const prisma = new PrismaClient();
const getQuizAttemptByIdCacheKey = (id: number) => `quiz_attempt:${id}`;

export const getQuizAttemptById = async (userId: number, id: number): Promise<quiz_attempts> => {
  const cacheKey = getQuizAttemptByIdCacheKey(id);
  const cachedData = await redis.get(cacheKey);

//   if (cachedData) return JSON.parse(cachedData);
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

  await redis.set(cacheKey, JSON.stringify(attempt), 'EX', 3600);
  return attempt;
};