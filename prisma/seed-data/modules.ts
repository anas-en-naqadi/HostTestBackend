import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedModules(prisma: PrismaClient, courseIds: number[]) {
  console.log('🌱 Seeding modules...');
  
  const createdModules: Array<any> = [];
  const modulesPerCourse: Record<number, any[]> = {};
  
  // For each course, create 4-7 modules
  for (const courseId of courseIds) {
    const numModules = Math.floor(Math.random() * 4) + 4; // 4-7 modules
    const courseModules: Array<any> = [];
    
    for (let i = 0; i < numModules; i++) {
      // Module titles based on position in course
      let title: string;
      if (i === 0) {
        title = "Introduction and Course Overview";
      } else if (i === numModules - 1) {
        title = "Final Project and Course Wrap-up";
      } else {
        // Generate a title based on the module number
        title = `Module ${i + 1}: ${faker.lorem.words(3).charAt(0).toUpperCase() + faker.lorem.words(3).slice(1)}`;
      }
      
      const module = await prisma.modules.create({
        data: {
          title,
          course_id: courseId,
          order_position: i + 1,
          duration: 0, // Temporary duration, will update after creating lessons
        }
      });
      
      createdModules.push(module);
      courseModules.push(module);
    }
    
    // Store modules for each course to use when creating lessons
    modulesPerCourse[courseId] = courseModules;
  }
  
  console.log(`✅ Created ${createdModules.length} modules`);
  return { createdModules, modulesPerCourse };
}
