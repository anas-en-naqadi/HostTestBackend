import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create user for instructor
//   const user = await prisma.users.create({
//     data: {
//       name: 'Jane Doe',
//       email: 'jane@instructor.com',
//       // other required fields in your `users` model
//     },
//   });

  // Create instructor
  const instructor = await prisma.instructors.create({
    data: {
      user_id: 7,
      description: 'Expert in web development',
      specialization: 'Frontend',
    },
  });

  // Create a category
  const category = await prisma.categories.create({
    data: {
      name: 'Web Development',
      slug: 'web-development',
    },
  });

  // Create a course
  await prisma.courses.create({
    data: {
      title: 'Intro to React',
      description: 'Learn the basics of React.js from scratch.',
      what_you_will_learn: ["JSX", "Components", "State", "Props"],
      course_requirements: ["HTML", "JavaScript basics"],
      instructor_id: instructor.id,
      category_id: category.id,
      thumbnail_url: 'https://via.placeholder.com/400x300',
      slug: 'intro-to-react',
      intro_video_url: 'https://some-video-url.com',
      difficulty: 'beginner', // assuming course_difficulty is an enum
      total_duration: 300,
    },
  });

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
