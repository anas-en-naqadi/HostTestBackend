import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

export const getQuizzes = async (userId: number) => {
  const cacheKey = `quizzes:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isAdmin = user.role_id === 1;
  const whereClause = isAdmin ? {} : { created_by: userId };

  const quizzes = await prisma.quizzes.findMany({
    where: whereClause,
    include: { questions: { include: { options: true } } },
  });

  await redis.set(cacheKey, JSON.stringify(quizzes), 'EX', 3600);
  return quizzes;
};