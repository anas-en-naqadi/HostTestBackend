import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Domain-specific quiz topics and questions
const quizTopics = {
  'web-development': [
    {
      text: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language', 'High Tech Multi Language', 'Hyper Transfer Markup Language', 'Hybrid Text Making Language'],
      correctIndex: 0
    },
    {
      text: 'Which CSS property is used to control the spacing between elements?',
      options: ['margin', 'padding', 'spacing', 'gap'],
      correctIndex: 0
    },
    {
      text: 'What JavaScript method is used to select an HTML element by its ID?',
      options: ['querySelector()', 'getElementByName()', 'getElementById()', 'selectElement()'],
      correctIndex: 2
    },
    {
      text: 'Which HTTP status code indicates a successful response?',
      options: ['200', '404', '500', '302'],
      correctIndex: 0
    },
    {
      text: 'What is the correct way to include an external JavaScript file?',
      options: ['<script href="file.js">', '<script src="file.js">', '<javascript src="file.js">', '<js import="file.js">'],
      correctIndex: 1
    },
    {
      text: 'Which of the following is NOT a JavaScript framework?',
      options: ['Angular', 'React', 'Django', 'Vue'],
      correctIndex: 2
    },
    {
      text: 'What does API stand for?',
      options: ['Application Programming Interface', 'Advanced Programming Integration', 'Automated Program Interface', 'Application Process Integration'],
      correctIndex: 0
    },
    {
      text: 'Which CSS layout model is designed for complex applications?',
      options: ['Flexbox', 'Grid', 'Block', 'Inline'],
      correctIndex: 1
    }
  ],
  'data-science': [
    {
      text: 'Which Python library is commonly used for data manipulation?',
      options: ['NumPy', 'Pandas', 'Matplotlib', 'TensorFlow'],
      correctIndex: 1
    },
    {
      text: 'What does SQL stand for?',
      options: ['Structured Query Language', 'Simple Question Language', 'Standard Query Logic', 'System Query Layer'],
      correctIndex: 0
    },
    {
      text: 'Which algorithm is NOT a supervised learning algorithm?',
      options: ['Linear Regression', 'K-means Clustering', 'Random Forest', 'Support Vector Machine'],
      correctIndex: 1
    },
    {
      text: 'What is the purpose of data normalization?',
      options: ['To increase data size', 'To scale features to a similar range', 'To remove all outliers', 'To convert categorical data to numerical'],
      correctIndex: 1
    },
    {
      text: 'Which visualization is best for showing the distribution of a continuous variable?',
      options: ['Bar chart', 'Pie chart', 'Histogram', 'Scatter plot'],
      correctIndex: 2
    },
    {
      text: 'What is the primary purpose of cross-validation in machine learning?',
      options: ['To improve model accuracy', 'To assess model performance on unseen data', 'To speed up training', 'To reduce model complexity'],
      correctIndex: 1
    },
    {
      text: 'Which technique is used to reduce the dimensionality of data?',
      options: ['Principal Component Analysis', 'K-Nearest Neighbors', 'Decision Trees', 'Gradient Boosting'],
      correctIndex: 0
    }
  ],
  'business': [
    {
      text: 'What does ROI stand for?',
      options: ['Return On Investment', 'Rate Of Increase', 'Risk Of Inflation', 'Revenue Over Income'],
      correctIndex: 0
    },
    {
      text: 'Which of these is NOT one of Porter\'s Five Forces?',
      options: ['Threat of new entrants', 'Bargaining power of suppliers', 'Digital transformation', 'Rivalry among existing competitors'],
      correctIndex: 2
    },
    {
      text: 'What is the primary purpose of a SWOT analysis?',
      options: ['Financial forecasting', 'Strategic planning', 'Employee evaluation', 'Market research'],
      correctIndex: 1
    },
    {
      text: 'Which financial statement shows a company\'s revenues and expenses over a period of time?',
      options: ['Balance Sheet', 'Cash Flow Statement', 'Income Statement', 'Equity Statement'],
      correctIndex: 2
    },
    {
      text: 'What leadership style involves making decisions without consulting team members?',
      options: ['Democratic', 'Laissez-faire', 'Transformational', 'Autocratic'],
      correctIndex: 3
    },
    {
      text: 'What is the term for the process of determining the value of a business?',
      options: ['Business modeling', 'Valuation', 'Profit analysis', 'Asset counting'],
      correctIndex: 1
    }
  ],
  'design': [
    {
      text: 'What does UI stand for in design?',
      options: ['User Interface', 'User Interaction', 'Universal Integration', 'Usability Index'],
      correctIndex: 0
    },
    {
      text: 'Which color model is used for digital design?',
      options: ['CMYK', 'RGB', 'HSL', 'PMS'],
      correctIndex: 1
    },
    {
      text: 'What principle refers to the arrangement of elements to create a sense of stability?',
      options: ['Contrast', 'Repetition', 'Balance', 'Proximity'],
      correctIndex: 2
    },
    {
      text: 'Which file format supports transparency?',
      options: ['JPG', 'PNG', 'BMP', 'GIF'],
      correctIndex: 1
    },
    {
      text: 'What is the purpose of white space in design?',
      options: ['To save ink when printing', 'To improve readability and focus', 'To reduce file size', 'To follow minimalist trends'],
      correctIndex: 1
    },
    {
      text: 'Which design principle emphasizes creating visual connections between elements?',
      options: ['Hierarchy', 'Alignment', 'Contrast', 'Repetition'],
      correctIndex: 1
    }
  ]
};

export async function seedQuizzes(prisma: PrismaClient, creatorIds: number[]) {
  console.log('🌱 Preparing quiz data...');
  
  // Function to create a quiz with questions and options
  async function createQuiz(creatorId: number, title: string, isFinal: boolean = false) {
    // Extract topic from title if possible
    let topicKey = 'web-development'; // Default topic
    
    // Try to determine the topic from the title
    if (title.toLowerCase().includes('web') || title.toLowerCase().includes('html') || title.toLowerCase().includes('javascript')) {
      topicKey = 'web-development';
    } else if (title.toLowerCase().includes('data') || title.toLowerCase().includes('python') || title.toLowerCase().includes('analytics')) {
      topicKey = 'data-science';
    } else if (title.toLowerCase().includes('business') || title.toLowerCase().includes('management') || title.toLowerCase().includes('finance')) {
      topicKey = 'business';
    } else if (title.toLowerCase().includes('design') || title.toLowerCase().includes('ui') || title.toLowerCase().includes('ux')) {
      topicKey = 'design';
    }
    
    // Create quiz with appropriate duration based on whether it's a final quiz
    const quiz = await prisma.quizzes.create({
      data: {
        title,
        duration_time: isFinal ? Math.floor(Math.random() * 1200) + 900 : Math.floor(Math.random() * 600) + 300, // 15-35 min for final, 5-15 min for regular
        created_by: creatorId,
        isFinal: isFinal,
      }
    });
    
    // Determine number of questions based on quiz type
    const numQuestions = isFinal ? Math.floor(Math.random() * 3) + 8 : Math.floor(Math.random() * 3) + 4; // 8-10 for final, 4-6 for regular
    
    // Get topic-specific questions
    const topicQuestions = quizTopics[topicKey] || [];
    
    // If we have topic-specific questions, use them; otherwise, generate random ones
    if (topicQuestions.length > 0) {
      // Randomly select questions from the topic pool without repetition
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < Math.min(numQuestions, topicQuestions.length)) {
        selectedIndices.add(Math.floor(Math.random() * topicQuestions.length));
      }
      
      // Create the selected questions
      for (const index of selectedIndices) {
        const questionData = topicQuestions[index];
        
        // Create question
        const question = await prisma.questions.create({
          data: {
            quiz_id: quiz.id,
            text: questionData.text,
          }
        });
        
        // Create options for this question
        for (let j = 0; j < questionData.options.length; j++) {
          await prisma.options.create({
            data: {
              question_id: question.id,
              text: questionData.options[j],
              is_correct: j === questionData.correctIndex,
            }
          });
        }
      }
    } else {
      // Fallback to random questions if no topic-specific ones are available
      for (let i = 0; i < numQuestions; i++) {
        // Create question
        const question = await prisma.questions.create({
          data: {
            quiz_id: quiz.id,
            text: faker.lorem.sentence() + '?',
          }
        });
        
        // Create 4 options for this question (1 correct, 3 incorrect)
        const correctOptionIndex = Math.floor(Math.random() * 4);
        
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
    }
    
    return quiz;
  }
  
  return { createQuiz };
}
