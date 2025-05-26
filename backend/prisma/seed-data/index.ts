import { seedCategories } from './categories';
import { seedRoles } from './roles';
import { seedUsers } from './users';
import { seedInstructors } from './instructors';
import { seedCourses } from './courses';
import { seedModules } from './modules';
import { seedQuizzes } from './quizzes';
import { seedLessons } from './lessons';
import { PrismaClient } from '@prisma/client';

export async function seed(prisma: PrismaClient) {
  try {
    // Seed in correct order to maintain relationships
    
    // 1. Categories
    const categories = await seedCategories(prisma);
    const categoryIds = categories.map(category => category.id);
    
    // 2. Roles (required before users)
    await seedRoles(prisma);
    
    // 3. Users (required before instructors)
    await seedUsers(prisma);
    
    // 4. Instructors
    const instructors = await seedInstructors(prisma);
    const instructorIds = instructors.map(instructor => instructor.id);
    
    // 5. Courses
    const courses = await seedCourses(prisma, categoryIds, instructorIds);
    const courseIds = courses.map(course => course.id);
    
    // 6. Modules for each course
    const { modulesPerCourse } = await seedModules(prisma, courseIds);
    
    // 7. Setup quiz creator function
    const { createQuiz } = await seedQuizzes(prisma, instructorIds.map(id => id));
    
    // 8. Lessons for each module, including quizzes where appropriate
    await seedLessons(prisma, modulesPerCourse, createQuiz);
    
    console.log('✅ Seed data completed successfully');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}
