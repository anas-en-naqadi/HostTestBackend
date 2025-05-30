import prisma from "../../config/prisma";

interface AnswerSubmission {
  questionId: number;
  optionId: number;
}

interface ValidationResult {
  questionId: number;
  optionId: number;
  isCorrect: boolean;
}

export const validateAnswersService = async (
  quizId: number,
  answers: AnswerSubmission[]
): Promise<ValidationResult[]> => {
  // Get all questions for this quiz with their options
  const questions = await prisma.questions.findMany({
    where: {
      quiz_id: quizId,
    },
    include: {
      options: true,
    },
  });

  // Map of question IDs to their options for quick lookup
  const questionsMap = new Map();
  questions.forEach(question => {
    questionsMap.set(question.id, question.options);
  });

  // Validate each answer
  const results: ValidationResult[] = [];
  
  for (const answer of answers) {
    const options = questionsMap.get(answer.questionId);
    if (!options) {
      // Question not found or doesn't belong to this quiz
      results.push({
        questionId: answer.questionId,
        optionId: answer.optionId,
        isCorrect: false,
      });
      continue;
    }

    const selectedOption = options.find((opt: any) => opt.id === answer.optionId);
    const isCorrect = !!(selectedOption && selectedOption.is_correct);

    results.push({
      questionId: answer.questionId,
      optionId: answer.optionId,
      isCorrect,
    });
  }

  return results;
};
