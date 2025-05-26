import { PrismaClient } from '@prisma/client';
import { seed } from './seed-data';

// Initialize Prisma client
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed process...');
  
  try {
    // Run the modular seed function that coordinates all seeding operations
    await seed(prisma);
    
    console.log('✅ Seed complete! Your database has been populated with test data.');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    // Exit with error code
    throw error;
  }
}

// Run the main function
main()
  .catch((e) => {
    console.error('Unhandled error during seeding:', e);
    throw e;
  })
  .finally(async () => {
    // Disconnect Prisma client when done
    await prisma.$disconnect();
  });
