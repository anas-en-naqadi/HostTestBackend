// src/services/quiz-management/list.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getQuizzes = async (userId: number) => {
  

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isAdmin = user.role_id === 1;
  const whereClause = isAdmin ? {} : { created_by: userId };

  // Get all quizzes with question count
  const quizzes = await prisma.quizzes.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      duration_time: true,
      created_by: true,
      isFinal: true,
      _count: {
        select: {
          questions: true
        }
      }
    },
    orderBy: { id: 'desc' }, // Most recent quizzes first
  });

  // Transform the data to include question count directly
  const transformedQuizzes = quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    duration_time: quiz.duration_time,
    isFinal: quiz.isFinal,
    question_count: quiz._count.questions
  }));

  return transformedQuizzes;
};