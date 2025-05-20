import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedQuizzes(prisma: PrismaClient, creatorIds: number[]) {
  console.log('🌱 Preparing quiz data...');
  
  // Function to create a quiz with questions and options
  async function createQuiz(creatorId: number, title: string) {
    // Create quiz
    const quiz = await prisma.quizzes.create({
      data: {
        title,
        duration_time: Math.floor(Math.random() * 900) + 300, // 5-20 minutes in seconds
        created_by: creatorId,
        isFinal: Math.random() > 0.8, // 20% chance of being a final quiz
      }
    });
    
    // Create 4-6 questions for this quiz
    const numQuestions = Math.floor(Math.random() * 3) + 4; // 4-6 questions
    
    for (let i = 0; i < numQuestions; i++) {
      // Create question
      const question = await prisma.questions.create({
        data: {
          quiz_id: quiz.id,
          text: faker.lorem.sentence() + '?',
        }
      });
      
      // Create 4 options for this question (1 correct, 3 incorrect)
      const correctOptionIndex = Math.floor(Math.random() * 4); // Randomly select which option is correct
      
      for (let j = 0; j < 4; j++) {
        await prisma.options.create({
          data: {
            question_id: question.id,
            text: faker.lorem.sentence().replace('.', ''),
            is_correct: j === correctOptionIndex,
          }
        });
      }
    }
    
    return quiz;
  }
  
  return { createQuiz };
}
