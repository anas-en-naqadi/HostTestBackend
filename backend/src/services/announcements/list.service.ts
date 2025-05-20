import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const getAnnouncements = async (userId: number, isAdmin: boolean): Promise<any[]> => {
  // For admins, return all announcements
  if (isAdmin) {
    return await prisma.announcements.findMany({
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            instructor_id: true,
            user: {
              select: {
                id: true,
                full_name: true,
                instructors: {
                  select: {
                    id: true,
                    specialization: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  // Return announcements for courses they teach or are enrolled in
  return await prisma.announcements.findMany({
    where: {
      OR: [
        { courses: { instructor_id: userId } }, // Courses they teach
        { courses: { enrollments: { some: { user_id: userId } } } } // Courses they're enrolled in
      ]
    },
    include: {
      courses: {
        select: {
          id: true,
          title: true,
          thumbnail_url: true,
          instructor_id: true,
          user: {
            select: {
              id: true,
              full_name: true,
              instructors: {
                select: {
                  id: true,
                  specialization: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  });
};