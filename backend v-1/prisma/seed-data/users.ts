import { PrismaClient, user_status } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

// Helper function to hash passwords securely
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function seedUsers(prisma: PrismaClient) {
  console.log('🌱 Seeding users...');
  
  // Check if we already have enough users
  const existingUserCount = await prisma.users.count();
  if (existingUserCount >= 6) {
    console.log(`✅ Found ${existingUserCount} existing users, skipping user creation`);
    return await prisma.users.findMany();
  }
  
  // Get all available roles
  const roles = await prisma.roles.findMany();
  
  if (roles.length === 0) {
    console.log('❌ No roles found. Creating default roles first...');
    // Create default roles if none exist
    await prisma.roles.createMany({
      data: [
        { name: 'admin', description: 'Administrator with full access' },
        { name: 'instructor', description: 'Can create and manage courses' },
        { name: 'student', description: 'Can enroll in courses' },
      ],
      skipDuplicates: true,
    });
    // Fetch the newly created roles
    const roles = await prisma.roles.findMany();
  }
  
  // Find role IDs
  const adminRole = roles.find(role => role.name === 'admin');
  const instructorRole = roles.find(role => role.name === 'instructor');
  const internRole = roles.find(role => role.name === 'intern');
  
  if (!adminRole || !instructorRole || !internRole) {
    throw new Error('Required roles not found. Please ensure admin, instructor, and intern roles exist.');
  }
  
  // Create users with different roles
  const usersToCreate = [
    // Admin user (1)
    {
      full_name: 'Admin User',
      username: 'admin',
      email: 'admin@academe.edu',
      password_hash: await hashPassword('Admin@123'),
      role_id: adminRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    // Instructor users (3)
    {
      full_name: 'John Instructor',
      username: 'john_instructor',
      email: 'john@academe.edu',
      password_hash: await hashPassword('Instructor@123'),
      role_id: instructorRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    {
      full_name: 'Sarah Teacher',
      username: 'sarah_teacher',
      email: 'sarah@academe.edu',
      password_hash: await hashPassword('Instructor@123'),
      role_id: instructorRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    {
      full_name: 'Michael Educator',
      username: 'michael_edu',
      email: 'michael@academe.edu',
      password_hash: await hashPassword('Instructor@123'),
      role_id: instructorRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    // Student users (4)
    {
      full_name: 'Alice Student',
      username: 'alice_student',
      email: 'alice@student.edu',
      password_hash: await hashPassword('Student@123'),
      role_id: internRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    {
      full_name: 'Bob Learner',
      username: 'bob_learner',
      email: 'bob@student.edu',
      password_hash: await hashPassword('Student@123'),
      role_id: internRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    {
      full_name: 'Charlie Scholar',
      username: 'charlie_scholar',
      email: 'charlie@student.edu',
      password_hash: await hashPassword('Student@123'),
      role_id: internRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
    {
      full_name: 'Diana Pupil',
      username: 'diana_pupil',
      email: 'diana@student.edu',
      password_hash: await hashPassword('Student@123'),
      role_id: internRole.id,
      email_verified: true,
      status: 'active' as user_status,
    },
  ];

  // Create users one by one to handle unique constraints better
  const createdUsers: any[] = [];
  for (const userData of usersToCreate) {
    try {
      // Check if user with this email already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: userData.email },
      });
      
      if (!existingUser) {
        const user = await prisma.users.create({ data: userData });
        createdUsers.push(user);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }

  console.log(`✅ Created ${createdUsers.length} users`);
  
  // Return all users (both newly created and existing)
  return await prisma.users.findMany();
}
