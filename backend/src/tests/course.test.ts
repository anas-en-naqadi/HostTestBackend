import { PrismaClient } from '@prisma/client';
import { createCourse, listAllCourses, getCourseBySlug, removeCourseBySlug } from '../services/course';
import { AppError } from '../middleware/error.middleware';
import { course_difficulty } from '@prisma/client';


jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    courses: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    modules: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    lessons: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prisma = new (jest.requireMock('@prisma/client').PrismaClient)();


describe('Courses Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a course successfully', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Description of test course',
      what_you_will_learn: ['Learn X', 'Learn Y'],
      course_requirements: ['Requirement 1'],
      instructor_id: 1,
      category_id: 1,
      thumbnail_url: 'http://example.com/image.png',
      slug: 'test-course',
      intro_video_url: 'http://example.com/video.mp4',
      difficulty: course_difficulty.beginner,
      modules: [],
    };

    (prisma.courses.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.courses.create as jest.Mock).mockResolvedValue({ id: 1, ...courseData });

    const createdCourse = await createCourse(courseData);
    expect(createdCourse).toEqual({ id: 1, ...courseData });
  });

//   it('should throw an error if course slug already exists', async () => {
//     const courseData = {
//       title: 'Test Course',
//       description: 'Description of test course',
//       what_you_will_learn: ['Learn X', 'Learn Y'],
//       course_requirements: ['Requirement 1'],
//       instructor_id: 1,
//       category_id: 1,
//       thumbnail_url: 'http://example.com/image.png',
//       slug: 'test-course',
//       intro_video_url: 'http://example.com/video.mp4',
//       difficulty:  course_difficulty.beginner,
//       modules: [],
//     };

//     (prisma.courses.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

//     await expect(createCourse(courseData)).rejects.toThrow(AppError);
//   });

//   it('should update a course successfully', async () => {
//     const courseSlug = 'test-course';
//     const updateData = { title: 'Updated Course Title' };

//     (prisma.courses.findUnique as jest.Mock).mockResolvedValue({ slug: courseSlug });
//     (prisma.courses.update as jest.Mock).mockResolvedValue({ ...updateData, slug: courseSlug });

//     const updatedCourse = await updateCourse(courseSlug, updateData);
//     expect(updatedCourse).toEqual({ ...updateData, slug: courseSlug });
//   });

//   it('should throw an error if course not found for update', async () => {
//     const courseSlug = 'non-existent-course';
//     const updateData = { title: 'Updated Course Title' };

//     prisma.courses.findUnique.mockResolvedValue(null);

//     await expect(updateCourse(courseSlug, updateData)).rejects.toThrow(AppError);
//   });

  it('should list all courses successfully', async () => {
    const courses = [{ id: 1, title: 'Course 1' }, { id: 2, title: 'Course 2' }];
    prisma.courses.findMany.mockResolvedValue(courses);

    const result = await listAllCourses();
    expect(result).toEqual(courses);
  });

  it('should get a course by slug successfully', async () => {
    const slug = 'test-course';
    const course = { id: 1, title: 'Test Course', slug };

    prisma.courses.findUnique.mockResolvedValue(course);

    const result = await getCourseBySlug(slug);
    expect(result).toEqual(course);
  });

//   it('should throw an error if course not found by slug', async () => {
//     const slug = 'non-existent-course';

//     prisma.courses.findUnique.mockResolvedValue(null);

//     await expect(getCourseBySlug(slug)).rejects.toThrow(AppError);
//   });

  it('should remove a course by slug successfully', async () => {
    const slug = 'test-course';

    prisma.courses.findUnique.mockResolvedValue({ slug });
    prisma.courses.delete.mockResolvedValue({});

    await expect(removeCourseBySlug(slug)).resolves.not.toThrow();
  });

//   it('should throw an error if course not found for removal', async () => {
//     const slug = 'non-existent-course';

//     prisma.courses.findUnique.mockResolvedValue(null);

//     await expect(removeCourseBySlug(slug)).rejects.toThrow(AppError);
//   });
});
