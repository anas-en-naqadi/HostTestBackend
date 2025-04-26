import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

export const getQuizById = async (userId: number, quizId: number) => {
  const cacheKey = `quiz:${quizId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const quiz = await prisma.quizzes.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true } } },
  });

  if (!quiz) throw new Error('Quiz not found');

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error('Unauthorized: You can only view your own quizzes unless you are an admin');
  }

  await redis.set(cacheKey, JSON.stringify(quiz), 'EX', 3600);
  return quiz;
};