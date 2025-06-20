// src/services/quiz-management/create.service.ts
import { PrismaClient } from "@prisma/client";
import {
  CACHE_KEYS,
  deleteFromCache,
  generateCacheKey,
} from "../../utils/cache.utils";
const prisma = new PrismaClient();

interface OptionInput {
  text: string;
  is_correct: boolean;
}

interface QuestionInput {
  text: string;
  options: OptionInput[];
}

interface QuizInput {
  title: string;
  duration_time: number;
  questions: QuestionInput[];
  isFinal?: boolean;
}

export const createQuizWithDetails = async (
  userId: number,
  data: QuizInput
) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
    // 1 = admin, 2 = instructor
    throw new Error(
      "Unauthorized: Only instructors or admins can create quizzes"
    );
  }

  const quiz = await prisma.$transaction(async (tx) => {
    const newQuiz = await tx.quizzes.create({
      data: {
        title: data.title,
        duration_time: data.duration_time,
        isFinal: data.isFinal || false,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    const lesson = await tx.lessons.findFirst({
      where: { quiz_id: newQuiz.id },
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

    for (const q of data.questions) {
      const newQuestion = await tx.questions.create({
        data: {
          quiz_id: newQuiz.id,
          text: q.text,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.options.createMany({
        data: q.options.map((opt) => ({
          question_id: newQuestion.id,
          text: opt.text,
          is_correct: opt.is_correct,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });
    }

    await deleteFromCache(
      generateCacheKey(
        CACHE_KEYS.COURSE,
        `learn-${lesson?.modules.courses?.slug}-${userId}`
      )
    );
    return newQuiz;
  });

  return quiz;
};
