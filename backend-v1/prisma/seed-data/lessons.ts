import { PrismaClient, lesson_content_type } from '@prisma/client';
import { faker } from '@faker-js/faker';

// Domain-specific quiz topics for realistic content
type QuizQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
};

type QuizTopic = {
  title: string;
  questions: QuizQuestion[];
};

const quizTopics: Record<string, QuizTopic> = {
  'web-development': {
    title: 'Web Development Quiz',
    questions: [
      { text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Multi Language', 'Hyper Transfer Markup Language', 'Hybrid Text Making Language'], correctIndex: 0 },
      { text: 'Which CSS property is used to control the spacing between elements?', options: ['margin', 'padding', 'spacing', 'gap'], correctIndex: 0 },
      { text: 'What JavaScript method is used to select an HTML element by its ID?', options: ['querySelector()', 'getElementByName()', 'getElementById()', 'selectElement()'], correctIndex: 2 },
      { text: 'Which HTTP status code indicates a successful response?', options: ['200', '404', '500', '302'], correctIndex: 0 },
      { text: 'What is the correct way to include an external JavaScript file?', options: ['<script href="file.js">', '<script src="file.js">', '<javascript src="file.js">', '<js import="file.js">'], correctIndex: 1 }
    ]
  },
  'data-science': {
    title: 'Data Science Fundamentals',
    questions: [
      { text: 'Which Python library is commonly used for data manipulation?', options: ['NumPy', 'Pandas', 'Matplotlib', 'TensorFlow'], correctIndex: 1 },
      { text: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Question Language', 'Standard Query Logic', 'System Query Layer'], correctIndex: 0 },
      { text: 'Which algorithm is NOT a supervised learning algorithm?', options: ['Linear Regression', 'K-means Clustering', 'Random Forest', 'Support Vector Machine'], correctIndex: 1 },
      { text: 'What is the purpose of data normalization?', options: ['To increase data size', 'To scale features to a similar range', 'To remove all outliers', 'To convert categorical data to numerical'], correctIndex: 1 },
      { text: 'Which visualization is best for showing the distribution of a continuous variable?', options: ['Bar chart', 'Pie chart', 'Histogram', 'Scatter plot'], correctIndex: 2 }
    ]
  },
  'business': {
    title: 'Business Management Essentials',
    questions: [
      { text: 'What does ROI stand for?', options: ['Return On Investment', 'Rate Of Increase', 'Risk Of Inflation', 'Revenue Over Income'], correctIndex: 0 },
      { text: 'Which of these is NOT one of Porter\'s Five Forces?', options: ['Threat of new entrants', 'Bargaining power of suppliers', 'Digital transformation', 'Rivalry among existing competitors'], correctIndex: 2 },
      { text: 'What is the primary purpose of a SWOT analysis?', options: ['Financial forecasting', 'Strategic planning', 'Employee evaluation', 'Market research'], correctIndex: 1 },
      { text: 'Which financial statement shows a company\'s revenues and expenses over a period of time?', options: ['Balance Sheet', 'Cash Flow Statement', 'Income Statement', 'Equity Statement'], correctIndex: 2 },
      { text: 'What leadership style involves making decisions without consulting team members?', options: ['Democratic', 'Laissez-faire', 'Transformational', 'Autocratic'], correctIndex: 3 }
    ]
  },
  'design': {
    title: 'Design Principles Assessment',
    questions: [
      { text: 'What does UI stand for in design?', options: ['User Interface', 'User Interaction', 'Universal Integration', 'Usability Index'], correctIndex: 0 },
      { text: 'Which color model is used for digital design?', options: ['CMYK', 'RGB', 'HSL', 'PMS'], correctIndex: 1 },
      { text: 'What principle refers to the arrangement of elements to create a sense of stability?', options: ['Contrast', 'Repetition', 'Balance', 'Proximity'], correctIndex: 2 },
      { text: 'Which file format supports transparency?', options: ['JPG', 'PNG', 'BMP', 'GIF'], correctIndex: 1 },
      { text: 'What is the purpose of white space in design?', options: ['To save ink when printing', 'To improve readability and focus', 'To reduce file size', 'To follow minimalist trends'], correctIndex: 1 }
    ]
  }
};

export async function seedLessons(
  prisma: PrismaClient, 
  modulesPerCourse: Record<number, any[]>,
  quizCreator: (creatorId: number, title: string, isFinal?: boolean) => Promise<any>
) {
  console.log('🌱 Seeding lessons...');
  
  // Define video URLs as provided
  const videoUrls = [
    'https://videos.pexels.com/video-files/4443268/4443268-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/4443255/4443255-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/8342366/8342366-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/2098988/2098988-sd_640_360_30fps.mp4',
    'https://videos.pexels.com/video-files/3214020/3214020-sd_640_360_25fps.mp4'
  ];
  
  const courseDurations: Record<number, number> = {};
  const createdLessons: any[] = [];
  
  // Get an instructor ID for quiz creation
  const instructor = await prisma.instructors.findFirst({
    select: { user_id: true }
  });
  const quizCreatorId = instructor?.user_id || 1; // Default to ID 1 if not found
  
  // Process each course's modules
  for (const [courseId, modules] of Object.entries(modulesPerCourse)) {
    let totalCourseDuration = 0;
    const courseTopicKeys = Object.keys(quizTopics);
    const courseTopicKey = courseTopicKeys[parseInt(courseId) % courseTopicKeys.length];
    
    // For each module, create lessons
    for (const module of modules) {
      // Determine if this is the final module
      const isFinalModule = module.order_position === modules.length;
      
      // For final module, create only one lesson with a final quiz
      // For regular modules, create 3-5 lessons with the last one being a quiz
      const numLessons = isFinalModule ? 1 : Math.floor(Math.random() * 3) + 3; // 3-5 lessons for regular modules, 1 for final
      let totalModuleDuration = 0;
      
      for (let i = 0; i < numLessons; i++) {
        // Determine if this is the last lesson in the module
        const isLastLesson = i === numLessons - 1;
        
        // Generate appropriate lesson title based on position
        let lessonTitle: string;
        if (i === 0 && module.order_position === 1) {
          lessonTitle = "Course Introduction";
        } else if (isFinalModule) {
          lessonTitle = "Final Course Assessment";
        } else if (isLastLesson) {
          lessonTitle = `Module ${module.order_position} Assessment`;
        } else {
          lessonTitle = `Lesson ${i + 1}: ${faker.lorem.words(3).charAt(0).toUpperCase() + faker.lorem.words(3).slice(1)}`;
        }
        
        // Determine content type
        // - First lesson of first module is always video
        // - Last lesson of each module is always quiz
        // - Final module has only one lesson which is a final quiz
        // - Other lessons are distributed: 70% video, 30% text
        let contentType: lesson_content_type;
        
        if (i === 0 && module.order_position === 1) {
          contentType = 'video'; // First lesson of first module
        } else if (isLastLesson || isFinalModule) {
          contentType = 'quiz';  // Last lesson of any module or any lesson in final module
        } else {
          contentType = Math.random() < 0.7 ? 'video' : 'text'; // Other lessons
        }
        
        // Duration in seconds depends on content type
        let duration = 0;
        let quizId = null;
        let videoUrl = null;
        let lessonText = null;
        
        switch (contentType) {
          case 'video':
            duration = Math.floor(Math.random() * 900) + 300; // 5-15 minutes
            videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
            break;
            
          case 'quiz':
            duration = Math.floor(Math.random() * 600) + 300; // 5-10 minutes
            
            // Determine if this is a final quiz
            const isFinalQuiz = isFinalModule;
            
            // Create a quiz with more realistic content
            const quizTitle = isFinalQuiz 
              ? `Final Assessment: ${quizTopics[courseTopicKey].title}` 
              : `Module ${module.order_position} Quiz: ${quizTopics[courseTopicKey].title}`;
              
            const quiz = await quizCreator(
              quizCreatorId,
              quizTitle,
              isFinalQuiz // Pass isFinal flag
            );
            
            quizId = quiz.id;
            break;
            
          case 'text':
            duration = Math.floor(Math.random() * 600) + 300; // 5-10 minutes reading time
            
            // Generate more realistic HTML text content based on the course topic
            const topicName = quizTopics[courseTopicKey].title.split(' ')[0]; // Extract first word of topic
            
            lessonText = `
              <h2>${lessonTitle}</h2>
              <p>${faker.lorem.paragraph(3)}</p>
              <h3>Key Concepts in ${topicName}</h3>
              <p>In this lesson, we'll explore essential concepts that form the foundation of ${topicName.toLowerCase()} knowledge.</p>
              <ul>
                <li><strong>Concept 1:</strong> ${faker.lorem.sentence()}</li>
                <li><strong>Concept 2:</strong> ${faker.lorem.sentence()}</li>
                <li><strong>Concept 3:</strong> ${faker.lorem.sentence()}</li>
              </ul>
              <p>${faker.lorem.paragraph(2)}</p>
              <h3>Practical Example</h3>
              <div class="example-box">
                <p>${faker.lorem.paragraph(1)}</p>
                <pre><code>
// Sample code example related to ${topicName}
function ${topicName.toLowerCase()}Example() {
  const data = getData();
  const result = processData(data);
  return displayResults(result);
}
                </code></pre>
              </div>
              <p>${faker.lorem.paragraph(1)}</p>
              <blockquote class="important-note">
                <p><strong>Important:</strong> ${faker.lorem.sentence()}</p>
              </blockquote>
              <h3>Summary</h3>
              <p>${faker.lorem.paragraph(2)}</p>
            `;
            break;
        }
        
        // Create the lesson
        const lesson = await prisma.lessons.create({
          data: {
            title: lessonTitle,
            module_id: module.id,
            content_type: contentType,
            video_url: videoUrl,
            lesson_text: lessonText,
            duration: duration,
            order_position: i + 1,
            quiz_id: quizId,
          }
        });
        
        createdLessons.push(lesson);
        totalModuleDuration += duration;
      }
      
      // Update module duration
      await prisma.modules.update({
        where: { id: module.id },
        data: { duration: totalModuleDuration }
      });
      
      totalCourseDuration += totalModuleDuration;
    }
    
    // Update course total duration
    await prisma.courses.update({
      where: { id: parseInt(courseId) },
      data: { total_duration: totalCourseDuration }
    });
    
    courseDurations[parseInt(courseId)] = totalCourseDuration;
  }
  
  console.log(`✅ Created ${createdLessons.length} lessons`);
  return { createdLessons, courseDurations };
}
