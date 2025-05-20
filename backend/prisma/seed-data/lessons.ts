import { PrismaClient, lesson_content_type } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedLessons(
  prisma: PrismaClient, 
  modulesPerCourse: Record<number, any[]>,
  quizCreator: (creatorId: number, title: string) => Promise<any>
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
  
  const contentTypes: lesson_content_type[] = ['video', 'quiz', 'text'];
  const courseDurations: Record<number, number> = {};
  const createdLessons = [];
  
  // Get an instructor ID for quiz creation
  const instructor = await prisma.instructors.findFirst({
    select: { user_id: true }
  });
  const quizCreatorId = instructor?.user_id || 1; // Default to ID 1 if not found
  
  // Process each course's modules
  for (const [courseId, modules] of Object.entries(modulesPerCourse)) {
    let totalCourseDuration = 0;
    
    // For each module, create 3-6 lessons
    for (const module of modules) {
      const numLessons = Math.floor(Math.random() * 4) + 3; // 3-6 lessons
      let totalModuleDuration = 0;
      
      for (let i = 0; i < numLessons; i++) {
        // Generate appropriate lesson title based on position
        let lessonTitle: string;
        if (i === 0 && module.order_position === 1) {
          lessonTitle = "Course Introduction";
        } else if (i === numLessons - 1 && module.order_position === modules.length) {
          lessonTitle = "Module Summary and Next Steps";
        } else {
          lessonTitle = `Lesson ${i + 1}: ${faker.lorem.words(4).charAt(0).toUpperCase() + faker.lorem.words(4).slice(1)}`;
        }
        
        // Determine content type with weighted distribution
        // 60% video, 20% quiz, 20% text
        let contentType: lesson_content_type;
        const rand = Math.random();
        if (rand < 0.6) {
          contentType = 'video';
        } else if (rand < 0.8) {
          contentType = 'quiz';
        } else {
          contentType = 'text';
        }
        
        // Special cases: first lesson is always video, last module has a quiz
        if (i === 0 && module.order_position === 1) {
          contentType = 'video';
        } else if (module.order_position === modules.length && i === numLessons - 1) {
          contentType = 'quiz';
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
            // Create a quiz for this lesson
            const quiz = await quizCreator(
              quizCreatorId, 
              `Quiz: ${lessonTitle}`
            );
            quizId = quiz.id;
            break;
            
          case 'text':
            duration = Math.floor(Math.random() * 600) + 300; // 5-10 minutes reading time
            // Generate HTML text content (200-400 words)
            lessonText = `
              <h2>${lessonTitle}</h2>
              <p>${faker.lorem.paragraphs(2)}</p>
              <h3>Key Concepts</h3>
              <ul>
                <li>${faker.lorem.sentence()}</li>
                <li>${faker.lorem.sentence()}</li>
                <li>${faker.lorem.sentence()}</li>
              </ul>
              <p>${faker.lorem.paragraphs(2)}</p>
              <h3>Example</h3>
              <pre><code>
// Sample code example
function example() {
  const result = performOperation();
  return result;
}
              </code></pre>
              <p>${faker.lorem.paragraph()}</p>
              <blockquote>${faker.lorem.sentence()}</blockquote>
              <p>${faker.lorem.paragraphs(1)}</p>
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
