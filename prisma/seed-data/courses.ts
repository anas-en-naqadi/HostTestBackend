import { PrismaClient, course_difficulty } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedCourses(prisma: PrismaClient, categoryIds: number[], instructorIds: number[]) {
  console.log('🌱 Seeding courses...');
  
  // Define image and video URLs as provided
  const thumbnailUrls = [
    'https://images.pexels.com/photos/8199133/pexels-photo-8199133.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/8423014/pexels-photo-8423014.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/164250/pexels-photo-164250.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2828723/pexels-photo-2828723.jpeg?auto=compress&cs=tinysrgb&w=600'
  ];
  
  const introVideoUrls = [
    'https://videos.pexels.com/video-files/4443268/4443268-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/4443255/4443255-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/8342366/8342366-sd_640_360_25fps.mp4',
    'https://videos.pexels.com/video-files/2098988/2098988-sd_640_360_30fps.mp4',
    'https://videos.pexels.com/video-files/3214020/3214020-sd_640_360_25fps.mp4'
  ];
  
  // Difficulty levels
  const difficultyLevels: course_difficulty[] = ['beginner', 'intermediate', 'advanced', 'allLevel'];
  
  // Course titles and related information by category
  const courseTemplates = {
    'Web Development': [
      { title: 'Complete JavaScript Masterclass', subtitle: 'From Zero to Hero' },
      { title: 'React.js for Professionals', subtitle: 'Build Modern Web Applications' },
      { title: 'Full-Stack Web Development with Node.js', subtitle: 'Backend to Frontend' },
      { title: 'Vue.js 3 Essentials', subtitle: 'The Progressive JavaScript Framework' },
      { title: 'CSS Grid & Flexbox for Responsive Layouts', subtitle: 'Master Modern CSS' },
    ],
    'Data Science': [
      { title: 'Python for Data Analysis', subtitle: 'Pandas, NumPy & Matplotlib' },
      { title: 'Machine Learning Fundamentals', subtitle: 'Algorithms & Implementation' },
      { title: 'Data Visualization with D3.js', subtitle: 'Interactive Data Stories' },
      { title: 'SQL for Data Scientists', subtitle: 'Query, Analyze & Present' },
    ],
    'UI/UX Design': [
      { title: 'Figma for UI/UX Designers', subtitle: 'Design, Prototype & Share' },
      { title: 'UX Research & User Testing', subtitle: 'Building User-Centered Products' },
      { title: 'UI Animation Fundamentals', subtitle: 'Motion Design for Interfaces' },
    ],
    'Mobile Development': [
      { title: 'Flutter Development Bootcamp', subtitle: 'Build Cross-Platform Apps' },
      { title: 'React Native from Scratch', subtitle: 'iOS & Android Development' },
      { title: 'Swift Programming for iOS', subtitle: 'Build Native iPhone Apps' },
    ],
    'DevOps': [
      { title: 'Docker & Kubernetes Mastery', subtitle: 'Container Orchestration' },
      { title: 'CI/CD Pipeline Implementation', subtitle: 'Automated Deployments' },
    ],
    'Artificial Intelligence': [
      { title: 'Deep Learning with TensorFlow', subtitle: 'Neural Networks & Beyond' },
      { title: 'Natural Language Processing', subtitle: 'Text Analysis with Python' },
    ],
    'Digital Marketing': [
      { title: 'SEO Optimization Strategies', subtitle: 'Rank Higher on Google' },
      { title: 'Social Media Marketing', subtitle: 'Growth & Engagement Tactics' },
    ]
  };
  
  // Generate 15-20 random courses
  const numCourses = Math.floor(Math.random() * 6) + 15; // 15-20 courses
  const createdCourses: Array<any> = [];
  
  // Get all categories for matching course templates
  const allCategories = await prisma.categories.findMany();
  
  for (let i = 0; i < numCourses; i++) {
    // Select a random category and instructor
    const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const instructorId = instructorIds[Math.floor(Math.random() * instructorIds.length)];
    
    // Find the category name
    const category = allCategories.find(c => c.id === categoryId);
    const categoryName = category?.name || 'Web Development'; // Default if not found
    
    // Get templates for this category or use general templates if none specific
    const templates = courseTemplates[categoryName as keyof typeof courseTemplates] || 
                     courseTemplates['Web Development'];
    
    // Choose a random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Generate a unique slug from the title
    const baseSlug = template.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/gi, '-');
    const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;
    
    // Generate "what you will learn" array
    const whatYouWillLearn = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => 
      faker.lorem.sentence().replace('.', '')
    );
    
    // Generate requirements array
    const courseRequirements = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => 
      faker.lorem.sentence().replace('.', '')
    );
    
    // Select random difficulty level
    const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];
    
    // Random thumbnail and intro video
    const thumbnailUrl = thumbnailUrls[Math.floor(Math.random() * thumbnailUrls.length)];
    const introVideoUrl = introVideoUrls[Math.floor(Math.random() * introVideoUrls.length)];
    
    // We'll set a temporary duration that will be updated after modules and lessons are created
    const tempDuration = 0;
    
    const course = await prisma.courses.create({
      data: {
        title: template.title,
        subtitle: template.subtitle,
        description: faker.lorem.paragraphs(3),
        what_you_will_learn: whatYouWillLearn,
        course_requirements: courseRequirements,
        instructor_id: instructorId,
        category_id: categoryId,
        thumbnail_url: thumbnailUrl,
        slug: slug,
        intro_video_url: introVideoUrl,
        difficulty: difficulty,
        is_published: true,
        total_duration: tempDuration, // Will update this later
      }
    });
    
    createdCourses.push(course);
  }
  
  console.log(`✅ Created ${createdCourses.length} courses`);
  return createdCourses;
}
