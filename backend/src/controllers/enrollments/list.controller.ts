// src/controllers/enrollments/list.controller.ts
import { Response, NextFunction, Request } from 'express';
import { getEnrollments } from '../../services/enrollments/list.service';
import { AppError } from '../../middleware/error.middleware';
import { EnrollmentWithCourse } from 'types/enrollment.types';
import { logActivity } from '../../utils/activity_log.utils';

export const getEnrollmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new AppError(401, 'User not authenticated');
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const userId = user.id;

    // Make sure your service returns both the enrollments *and* pagination info:
    const {
      enrollments,
      totalCount,
      totalPages,
      currentPage
    } = await getEnrollments(userId, page, limit);

    const courseData = (enrollments as EnrollmentWithCourse[]).map(e => {
      // Check if courses and modules exist before accessing them
      if (!e.courses || !e.courses.modules) {
        return {
          courseTitle: e.courses?.title || 'Unknown Course',
          instructorName: e.courses?.user?.full_name || 'Unknown Instructor',
          progressPercent: 0,
          courseThumbnail: e.courses?.thumbnail_url || '',
          completedLessons: 0,
          totalLessons: 0,
          courseSlug: e.courses?.slug || '',
          courseSubTitle: e.courses?.subtitle || ''
        };
      }

      // Total lessons across all modules
      const totalLessons = e.courses.modules.reduce(
        (modAcc, mod) => modAcc + (mod.lessons?.length || 0),
        0
      );
      
      // Total completed lessons
      const completedLessons = e.courses.modules.reduce(
        (modAcc, mod) => {
          if (!mod.lessons) return modAcc;
          
          return modAcc + mod.lessons.reduce(
            (lessonAcc, lesson) =>
              lessonAcc + (lesson.lesson_progress?.length > 0 ? 1 : 0),
            0
          );
        },
        0
      );
      
      // Progress %
      const progressPercent =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
          
      return {
        courseTitle: e.courses.title || 'Unknown Course',
        instructorName: e.courses?.user?.full_name || 'Unknown Instructor',
        progressPercent,
        courseThumbnail: e.courses.thumbnail_url || '',
        completedLessons,
        totalLessons,
        courseSlug: e.courses.slug || '',
        courseSubTitle: e.courses.subtitle || ''
      };
    });

    await logActivity(
      userId,
      'ENROLLMENT_LIST_VIEW',
      `${user.full_name} viewed their enrollments list (page ${currentPage}, limit ${limit})`,
      req.ip
    ).catch(console.error);


    res.status(200).json({
      success: true,
      message: 'Enrollments retrieved successfully',
      data: courseData,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        limit
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    } else {
      console.error('Get enrollments error:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to retrieve enrollments' });
    }
  }
};