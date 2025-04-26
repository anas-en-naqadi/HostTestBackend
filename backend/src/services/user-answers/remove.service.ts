import { PrismaClient } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getUserAnswersCacheKey = (userId: number) => `user_answers:${userId}`;
const getUserAnswerByIdCacheKey = (attemptId: number, questionId: number) => `user_answer:${attemptId}:${questionId}`;

export const deleteUserAnswer = async (userId: number, attemptId: number, questionId: number): Promise<void> => {
  const attempt = await prisma.quiz_attempts.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.user_id !== userId) throw new Error('Attempt not found or unauthorized');

  const existingAnswer = await prisma.user_answers.findUnique({
    where: { attempt_id_question_id: { attempt_id: attemptId, question_id: questionId } },
  });
  if (!existingAnswer) throw new Error('Answer not found');

  await prisma.user_answers.delete({
    where: { attempt_id_question_id: { attempt_id: attemptId, question_id: questionId } },
  });

  await redis.del(getUserAnswersCacheKey(userId));
  await redis.del(getUserAnswerByIdCacheKey(attemptId, questionId));
};