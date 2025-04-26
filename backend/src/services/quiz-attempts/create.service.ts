import { PrismaClient, quiz_attempts } from '@prisma/client';
import redis from '../../config/redis';


const prisma = new PrismaClient();
const getQuizAttemptsCacheKey = (userId: number) => `quiz_attempts:${userId}`;

export const createQuizAttempt = async (
  userId: number,
  quizId: number
): Promise<quiz_attempts> => {
  const quiz = await prisma.quizzes.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const lesson = await prisma.lessons.findFirst({
    where: { quiz_id: quizId },
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


  const attempt = await prisma.quiz_attempts.create({
    data: {
      user_id: userId,
      quiz_id: quizId,
      started_at: new Date(),
    },
  });


  await redis.del(getQuizAttemptsCacheKey(userId));
  return attempt;
};