import prisma from "../../config/prisma";

export const validateAnswerService = async (
  quizId: number,
  questionId: number,
  optionId: number
): Promise<boolean> => {
  // Find the option and make sure it belongs to the correct question and quiz, and check is_correct
  const option = await prisma.options.findFirst({
    where: {
      id: optionId,
      question_id: questionId,
      questions: {
        quiz_id: quizId,
      },
    },
    select: {
      is_correct: true,
    },
  });
  return !!(option && option.is_correct);
};