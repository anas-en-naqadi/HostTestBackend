import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  console.log('🌱 Seeding categories...');
  
  // Define categories with realistic names and slugs
  const categories = [
    { name: 'Web Development', created_by: 1, slug: 'web-development' },
    { name: 'Data Science', created_by: 1, slug: 'data-science' },
    { name: 'UI/UX Design', created_by: 1, slug: 'ui-ux-design' },
    { name: 'Mobile Development', created_by: 1, slug: 'mobile-development' },
    { name: 'DevOps', created_by: 1, slug: 'devops' },
    { name: 'Artificial Intelligence', created_by: 1, slug: 'artificial-intelligence' },
    { name: 'Digital Marketing', created_by: 1, slug: 'digital-marketing' },
  ];
  
  // Check for existing categories first
  const existingCategories = await prisma.categories.findMany();
  console.log(`Found ${existingCategories.length} existing categories`);
  
  // Create categories and store their IDs for reference
  const createdCategories: Array<{ id: number; name: string; slug: string }> = [...existingCategories];
  
  // Only create categories that don't already exist
  for (const category of categories) {
    const exists = existingCategories.some(c => c.slug === category.slug);
    
    if (!exists) {
      try {
        const createdCategory = await prisma.categories.create({
          data: category
        });
        createdCategories.push(createdCategory);
      } catch (error: any) {
        console.log(`Skipping category ${category.name}: ${error?.message || 'Unknown error'}`);
      }
    }
  }
  
  console.log(`✅ Created ${createdCategories.length} categories`);
  return createdCategories;
}
