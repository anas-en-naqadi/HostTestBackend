import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedInstructors(prisma: PrismaClient) {
  console.log('🌱 Seeding instructors...');
  
  // First, we need to get existing users to link to instructors
  const existingUsers = await prisma.users.findMany({
    take: 10, // Get a few extra in case some don't meet criteria
    orderBy: { id: 'asc' }
  });
  
  if (existingUsers.length < 6) {
    throw new Error('Not enough users found. Please create at least 6 users before seeding instructors.');
  }
  
  // Specializations for instructors
  const specializations = [
    'Web Development', 'Data Science', 'UX/UI Design', 
    'Mobile Development', 'Cloud Computing', 'Digital Marketing'
  ];
  
  // Create 4-6 instructors
  const numInstructors = Math.floor(Math.random() * 3) + 4; // 4-6 instructors
  const createdInstructors: Array<{ id: number; user_id: number; description: string | null; specialization: string | null }> = [];
  
  // Use distinct users for each instructor
  const selectedUsers = existingUsers.slice(0, numInstructors);
  
  for (let i = 0; i < numInstructors; i++) {
    // Check if instructor already exists for this user
    const existingInstructor = await prisma.instructors.findUnique({
      where: { user_id: selectedUsers[i].id }
    });
    
    if (!existingInstructor) {
      const instructor = await prisma.instructors.create({
        data: {
          user_id: selectedUsers[i].id,
          description: faker.lorem.paragraph(),
          specialization: specializations[i % specializations.length],
        }
      });
      createdInstructors.push(instructor);
    }
  }
  
  console.log(`✅ Created ${createdInstructors.length} instructors`);
  return createdInstructors;
}
