import { PrismaClient, user_answers } from '@prisma/client';
import redis from '../../config/redis';

const prisma = new PrismaClient();
const getUserAnswersCacheKey = (userId: number) => `user_answers:${userId}`;
const getUserAnswerByIdCacheKey = (attemptId: number, questionId: number) => `user_answer:${attemptId}:${questionId}`;

export const updateUserAnswer = async (
  userId: number,
  attemptId: number,
  questionId: number,
  optionId?: number
): Promise<user_answers> => {
  const attempt = await prisma.quiz_attempts.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.user_id !== userId) throw new Error('Attempt not found or unauthorized');

  const existingAnswer = await prisma.user_answers.findUnique({
    where: { attempt_id_question_id: { attempt_id: attemptId, question_id: questionId } },
  });
  if (!existingAnswer) throw new Error('Answer not found');

  if (optionId) {
    const option = await prisma.options.findUnique({ where: { id: optionId } });
    if (!option || option.question_id !== questionId) throw new Error('Option not found or invalid for this question');
  }

  const updatedAnswer = await prisma.user_answers.update({
    where: { attempt_id_question_id: { attempt_id: attemptId, question_id: questionId } },
    data: {
      option_id: optionId,
      answered_at: new Date(),
    },
  });

  await redis.del(getUserAnswersCacheKey(userId));
  await redis.del(getUserAnswerByIdCacheKey(attemptId, questionId));
  return updatedAnswer;
};