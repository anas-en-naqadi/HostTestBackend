import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('🌱 Seeding roles...');
  
  // Check if roles already exist
  const existingRoles = await prisma.roles.findMany();
  
  if (existingRoles.length > 0) {
    console.log(`✅ Found ${existingRoles.length} existing roles, skipping role creation`);
    return existingRoles;
  }
  
  // Define the standard roles for the system
  const rolesToCreate = [
    { name: 'admin', description: 'Administrator with full access to the platform' },
    { name: 'instructor', description: 'Can create and manage courses, lessons, and quizzes' },
    { name: 'intern', description: 'Can enroll in courses and track progress' },
  ];
  
  // Create roles
  const createdRoles: any[] = [];
  
  for (const roleData of rolesToCreate) {
    try {
      // Check if role with this name already exists
      const existingRole = await prisma.roles.findUnique({
        where: { name: roleData.name },
      });
      
      if (!existingRole) {
        const role = await prisma.roles.create({ data: roleData });
        createdRoles.push(role);
      } else {
        createdRoles.push(existingRole);
      }
    } catch (error: any) {
      console.error(`Error creating role ${roleData.name}:`, error?.message || 'Unknown error');
    }
  }

  console.log(`✅ Created ${createdRoles.length} roles`);
  return createdRoles;
}
