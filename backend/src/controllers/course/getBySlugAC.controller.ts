import { Request, Response } from "express";
import { getCourseBySlugAC } from "../../services/course";
import { errorResponse, successResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";
import { Module } from "types/course.types";
import { logActivity } from "../../utils/activity_log.utils";

export const getCourseBySlugACController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    // ✅ Extract userId from authenticated user (assuming a middleware sets req.user)
    const userId = req.user!.id; // Make sure your auth middleware adds user to req

    const course = await getCourseBySlugAC({slug, userId});
    const instructorCourses = course.user.courses.filter(
      (instructorCourse: any) => instructorCourse.id !== course.id
    );

    logActivity(
      userId,
      'COURSE_VIEW',
      `${req.user!.full_name} Viewed course with slug "${slug}"`,
      req.ip
    ).catch(console.error);
    // ✅ Optional: Adjust response structure if needed
    const formattedCourse = {
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      difficulty: course.difficulty,
      slug:course.slug,
      introVideo: course.intro_video_url,
      duration: course.total_duration,
      createdAt: course.created_at,
      whatYouWillLearn: course.what_you_will_learn,
      requirements: course.course_requirements,
      isEnrolled:Object.keys(course.enrollments).length ===1,
      categories: course.categories,
      isInWishList:Object.keys(course.wishlists).length > 0,
      instructor: {
        fullName: course.user.full_name,
        specialization: course.user.instructors.specialization,
        description: course.user.instructors.description,
        otherCourses: instructorCourses.map((c:any) => ({
          id: c.id,
          title: c.title,
          slug:c.slug,
          thumbnail: c.thumbnail_url,
          difficulty: c.difficulty,
          duration: c.total_duration,
          instructorName: c.user.full_name,
          isInWishList: Object.keys(c.wishlists).length > 0
        })),
      },
      enrollmentsCount: course._count.enrollments,
      modules: course.modules.map((m:Module) => ({
        id: m.id,
        title: m.title,
        duration: m.duration,
        orderPosition:m.order_position,
        lessons: m.lessons,
      })),
    };

    successResponse(res, formattedCourse);
  } catch (err) {
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode, err.errors);
    } else {
      errorResponse(res, "Internal server error", 500);
    }
  }
};
