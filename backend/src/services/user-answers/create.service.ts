import { PrismaClient, user_answers } from "@prisma/client";
import redis from "../../config/redis";

const prisma = new PrismaClient();
const getUserAnswersCacheKey = (userId: number) => `user_answers:${userId}`;
const getUserAnswerByIdCacheKey = (attemptId: number, questionId: number) =>
  `user_answer:${attemptId}:${questionId}`;

export const createUserAnswer = async (
  userId: number,
  data: { attemptId: number; questionId: number; optionId: number }
): Promise<user_answers> => {
  const attempt = await prisma.quiz_attempts.findUnique({
    where: { id: data.attemptId },
    include: {
      quizzes: {
        include: {
          lessons: {
            include: {
              modules: {
                include: { courses: { include: { enrollments: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!attempt || attempt.user_id !== userId)
    throw new Error("Attempt not found or unauthorized");

  const question = await prisma.questions.findUnique({
    where: { id: data.questionId },
  });
  if (!question || question.quiz_id !== attempt.quiz_id)
    throw new Error("Question not found or not part of this quiz");

  if (data.optionId) {
    const option = await prisma.options.findUnique({
      where: { id: data.optionId },
    });
    if (!option || option.question_id !== data.questionId)
      throw new Error("Option not found or invalid for this question");
  }

  const answer = await prisma.user_answers.create({
    data: {
      attempt_id: data.attemptId,
      question_id: data.questionId,
      option_id: data.optionId,
      answered_at: new Date(),
    },
  });

  await redis.del(getUserAnswersCacheKey(userId));
  await redis.del(getUserAnswerByIdCacheKey(data.attemptId, data.questionId));
  return answer;
};
