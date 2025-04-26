import { PrismaClient, quiz_attempts } from '@prisma/client';
import redis from '../../config/redis';


const prisma = new PrismaClient();
const getQuizAttemptsCacheKey = (userId: number) => `quiz_attempts:${userId}`;

export const getQuizAttempts = async (
  userId: number,
  quizId?: number
): Promise<quiz_attempts[]> => {
  const cacheKey = getQuizAttemptsCacheKey(userId);
  const cachedData = await redis.get(cacheKey);

//   if (cachedData) return JSON.parse(cachedData);
  const whereClause: any = { user_id: userId };
  if (quizId) {
    whereClause.quiz_id = quizId;

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
  }

  const attempts = await prisma.quiz_attempts.findMany({
    where: whereClause,
    include: { user_answers: true },
  });

  await redis.set(cacheKey, JSON.stringify(attempts), 'EX', 3600);
  return attempts;
};