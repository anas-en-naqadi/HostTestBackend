import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export const getQuizById = async (userId: number, quizId: number) => {
  

  const quiz = await prisma.quizzes.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true } } },
  });

  if (!quiz) throw new Error('Quiz not found');

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error('Unauthorized: You can only view your own quizzes unless you are an admin');
  }

  return quiz;
};
