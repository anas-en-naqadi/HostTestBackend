import { PrismaClient, user_answers } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getUserAnswerByIdCacheKey = (attemptId: number, questionId: number) => `user_answer:${attemptId}:${questionId}`;

export const getUserAnswerById = async (userId: number, attemptId: number, questionId: number): Promise<user_answers> => {
  const cacheKey = getUserAnswerByIdCacheKey(attemptId, questionId);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) return JSON.parse(cachedData);

  const attempt = await prisma.quiz_attempts.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.user_id !== userId) throw new Error('Attempt not found or unauthorized');

  const answer = await prisma.user_answers.findUnique({
    where: { attempt_id_question_id: { attempt_id: attemptId, question_id: questionId } },
  });
  if (!answer) throw new Error('Answer not found');

  await redis.set(cacheKey, JSON.stringify(answer), 'EX', 3600);
  return answer;
};