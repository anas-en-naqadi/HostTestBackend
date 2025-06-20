// Modified updateQuizWithDetails function to handle new questions
import { PrismaClient } from "@prisma/client";
import { CACHE_KEYS, deleteFromCache, generateCacheKey } from "../../utils/cache.utils";

const prisma = new PrismaClient();

interface OptionInput {
  id?: number; // Optional since new options won't have IDs
  text: string;
  is_correct: boolean;
}

interface QuestionInput {
  id?: number; // Optional since new questions won't have IDs
  text: string;
  options: OptionInput[];
}

interface QuizInputWithId {
  id: number;
  title: string;
  duration_time: number;
  isFinal?: boolean;
  questions: QuestionInput[];
}

export const updateQuizWithDetails = async (
  userId: number,
  data: QuizInputWithId
) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || (user.role_id !== 1 && user.role_id !== 2)) {
    throw new Error(
      "Unauthorized: Only instructors or admins can update quizzes"
    );
  }

  const quiz = await prisma.quizzes.findUnique({ 
    where: { id: data.id },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });
  
  if (!quiz || (quiz.created_by !== userId && user.role_id !== 1)) {
    throw new Error(
      "Unauthorized: You can only update your own quizzes unless you are an admin"
    );
  }

  await prisma.$transaction(async (tx) => {
    // Update quiz details
    await tx.quizzes.update({
      where: { id: data.id },
      data: {
        title: data.title,
        duration_time: data.duration_time,
        isFinal: data.isFinal,
        updated_at: new Date(),
      },
    });

    // Find questions that need to be removed (existing in database but not in the update data)
    const existingQuestionIds = quiz.questions.map(q => q.id);
    const updatedQuestionIds = data.questions
      .filter(q => q.id !== undefined)
      .map(q => q.id);
    
    const questionIdsToRemove = existingQuestionIds.filter(
      id => !updatedQuestionIds.includes(id)
    );

    // Delete questions that are no longer present
    if (questionIdsToRemove.length > 0) {
      await tx.questions.deleteMany({
        where: {
          id: { in: questionIdsToRemove },
          quiz_id: data.id
        }
      });
    }

    // Handle existing questions and their options
    for (const q of data.questions.filter(q => q.id !== undefined)) {
      // Skip new questions - we'll handle them separately
      if (!q.id) continue;

      // Verify question exists and belongs to the quiz
      const existingQuestion = await tx.questions.findUnique({
        where: { id: q.id },
        include: { options: true }
      });
      
      if (!existingQuestion || existingQuestion.quiz_id !== data.id) {
        throw new Error(
          `Question with ID ${q.id} not found or does not belong to quiz`
        );
      }

      // Update question
      await tx.questions.update({
        where: { id: q.id },
        data: { text: q.text, updated_at: new Date() },
      });

      // Find options that need to be removed
      const existingOptionIds = existingQuestion.options.map(o => o.id);
      const updatedOptionIds = q.options
        .filter(o => o.id !== undefined)
        .map(o => o.id);
      
      const optionIdsToRemove = existingOptionIds.filter(
        id => !updatedOptionIds.includes(id)
      );

      // Delete options that are no longer present
      if (optionIdsToRemove.length > 0) {
        await tx.options.deleteMany({
          where: {
            id: { in: optionIdsToRemove },
            question_id: q.id
          }
        });
      }

      // Update existing options and add new ones
      for (const opt of q.options) {
        if (opt.id) {
          // Update existing option
          const existingOption = await tx.options.findUnique({
            where: { id: opt.id },
          });
          
          if (!existingOption || existingOption.question_id !== q.id) {
            throw new Error(
              `Option with ID ${opt.id} not found or does not belong to question`
            );
          }

          await tx.options.update({
            where: { id: opt.id },
            data: {
              text: opt.text,
              is_correct: opt.is_correct,
              updated_at: new Date(),
            },
          });
        } else {
          // Add new option to existing question
          await tx.options.create({
            data: {
              text: opt.text,
              is_correct: opt.is_correct,
              question_id: q.id,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }
    }

    // Handle new questions with their options
    for (const q of data.questions.filter(q => q.id === undefined)) {
      // Create new question
      const newQuestion = await tx.questions.create({
        data: {
          text: q.text,
          quiz_id: data.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create options for the new question
      for (const opt of q.options) {
        await tx.options.create({
          data: {
            text: opt.text,
            is_correct: opt.is_correct,
            question_id: newQuestion.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
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
    throw new Error("Failed to fetch updated quiz");
  }

  const lesson = await prisma.lessons.findFirst({
    where: { quiz_id: data.id },
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

  return updatedQuiz;
};