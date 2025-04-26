// src/services/quiz-management/create.service.ts
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis();

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
}

export const createQuizWithDetails = async (userId: number, data: QuizInput) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (user.role_id !== 1 && user.role_id !== 2)) { // 1 = admin, 2 = instructor
    throw new Error('Unauthorized: Only instructors or admins can create quizzes');
  }

  const quiz = await prisma.$transaction(async (tx) => {
    const newQuiz = await tx.quizzes.create({
      data: {
        title: data.title,
        duration_time: data.duration_time,
        created_by: userId, 
        created_at: new Date(),
        updated_at: new Date(),
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
        data: q.options.map(opt => ({
          question_id: newQuestion.id,
          text: opt.text,
          is_correct: opt.is_correct,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });
    }

    return newQuiz;
  });

  await redis.del(`quizzes:${userId}`);
  return quiz;
};