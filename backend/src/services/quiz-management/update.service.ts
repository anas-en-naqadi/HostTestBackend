import { PrismaClient } from '@prisma/client';
import redis from "../../config/redis";
const prisma = new PrismaClient();


interface OptionInputWithId {
  id: number; // Required, as we only update existing options
  text: string;
  is_correct: boolean;
}

interface QuestionInputWithId {
  id: number; // Required, as we only update existing questions
  text: string;
  options: OptionInputWithId[];
}

interface QuizInputWithId {
  id: number;
  title: string;
  duration_time: number;
  questions: QuestionInputWithId[];
}

export const updateQuizWithDetails = async (userId: number, data: QuizInputWithId) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
    throw new Error('Unauthorized: Only instructors or admins can update quizzes');
  }

  const quiz = await prisma.quizzes.findUnique({ where: { id: data.id } });
  if (!quiz || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error('Unauthorized: You can only update your own quizzes unless you are an admin');
  }

  await prisma.$transaction(async (tx) => {
    // Update quiz details
    await tx.quizzes.update({
      where: { id: data.id },
      data: { title: data.title, duration_time: data.duration_time, updated_at: new Date() },
    });

    // Update existing questions and options
    for (const q of data.questions) {
      if (!q.id) {
        throw new Error('Question ID is required for updates');
      }

      // Verify question exists and belongs to the quiz
      const existingQuestion = await tx.questions.findUnique({
        where: { id: q.id },
      });
      if (!existingQuestion || existingQuestion.quiz_id !== data.id) {
        throw new Error(`Question with ID ${q.id} not found or does not belong to quiz`);
      }

      // Update question
      await tx.questions.update({
        where: { id: q.id },
        data: { text: q.text, updated_at: new Date() },
      });

      // Update existing options
      for (const opt of q.options) {
        if (!opt.id) {
          throw new Error('Option ID is required for updates');
        }

        // Verify option exists and belongs to the question
        const existingOption = await tx.options.findUnique({
          where: { id: opt.id },
        });
        if (!existingOption || existingOption.question_id !== q.id) {
          throw new Error(`Option with ID ${opt.id} not found or does not belong to question`);
        }

        await tx.options.update({
          where: { id: opt.id },
          data: { text: opt.text, is_correct: opt.is_correct, updated_at: new Date() },
        });
      }
    }
  });

  // Fetch and return the updated quiz with questions and options
  const updatedQuiz = await prisma.quizzes.findUnique({
    where: { id: data.id },
    include: {
      questions: {
        include: { options: true },
      },
    },
  });

  if (!updatedQuiz) {
    throw new Error('Failed to fetch updated quiz');
  }

  // Invalidate caches
  await redis.del(`quizzes:${userId}`);
  await redis.del(`quiz:${data.id}`);

  return updatedQuiz;
};