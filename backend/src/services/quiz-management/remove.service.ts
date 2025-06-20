import { PrismaClient } from "@prisma/client";
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();

export const deleteQuiz = async (userId: number, quizId: number) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
    throw new Error(
      "Unauthorized: Only instructors or admins can delete quizzes"
    );
  }

  const quiz = await prisma.quizzes.findUnique({ where: { id: quizId } });
  if (!quiz || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error(
      "Unauthorized: You can only delete your own quizzes unless you are an admin"
    );
  }

  await prisma.quizzes.delete({ where: { id: quizId } });

  const lesson = await prisma.lessons.findFirst({
    where: { quiz_id: quizId },
    select: {
      modules: {
        select: {
          courses: {
            select: { slug: true },
          },
        },
      },
    },
  });

  await deleteFromCache(
    generateCacheKey(
      CACHE_KEYS.COURSE,
      `learn-${lesson?.modules.courses?.slug}-${userId}`
    )
  );
};

export const deleteQuestion = async (userId: number, questionId: number) => {
  const question = await prisma.questions.findUnique({
    where: { id: questionId },
    include: { quizzes: true },
  });

  if (!question) throw new Error("Question not found");

  const quiz = question.quizzes;
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error(
      "Unauthorized: You can only delete questions from your own quizzes unless you are an admin"
    );
  }

  await prisma.questions.delete({ where: { id: questionId } });
};

export const deleteOption = async (userId: number, optionId: number) => {
  const option = await prisma.options.findUnique({
    where: { id: optionId },
    include: { questions: { include: { quizzes: true } } },
  });

  if (!option) throw new Error("Option not found");

  const quiz = option.questions.quizzes;
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error(
      "Unauthorized: You can only delete options from your own quizzes unless you are an admin"
    );
  }

  await prisma.options.delete({ where: { id: optionId } });
};
