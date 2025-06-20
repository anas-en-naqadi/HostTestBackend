import { Request, Response } from "express";
import {getCourseBySlug} from '../../services/course/listBySlug.service';
import { errorResponse, successResponse } from "../../utils/api.utils";
import { AppError } from "../../middleware/error.middleware";
import { Lesson, Module } from "types/course.types";
import { logActivity } from "../../utils/activity_log.utils";

export const getCourseBySlugController = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const userId = req?.user?.id;
    if(!userId){
      throw new AppError(401,"User Unauthenticated");
    }

    const {course , notes} = await getCourseBySlug(slug,userId);

    if (!course) {
      throw new AppError(404, "Course not found");
    }
    const modules = course.modules.map((mod:Module) => ({
      id:             mod.id,
      title:          mod.title,
      duration:       mod.duration,
      order_position: mod.order_position,
      lessons: mod.lessons.map((les:any) => {
        // Build quizWithStatus or null
        const quizWithStatus = les.quizzes
          ? {
              ...les.quizzes,
              isQuizPassed: les.quizzes.quiz_attempts.some(
                (att:any) => att.passed
              ),
            }
          : null;

        return {
          id:             les.id,
          title:          les.title,
          content_type:   les.content_type,
          video_url:      les.video_url,
          lesson_text:    les.lesson_text,
          duration:       les.duration,
          order_position: les.order_position,
          quiz:           quizWithStatus,
          isCompleted:les.lesson_progress.length > 0 ? (les.lesson_progress[0].status === "completed" && les.lesson_progress[0].completed_at !== null) : false
        };
      }),
    }));
    course.modules = modules;
    const learn_detail = {
      ...course,
      isEnrolled:   Object.keys(course.enrollments).length > 0,
      notes
    };

    logActivity(
      userId,
      'COURSE_WATCH',
      `${req.user!.full_name} watched course with slug "${slug}"`,
      req.ip
    ).catch(console.error);

    successResponse(res, learn_detail);
  } catch (err) {
    console.log(err)
    if (err instanceof AppError) {
      errorResponse(res, err.message, err.statusCode,err.errors);
    } else {
      errorResponse(res, "Internal server error", 500);
    }
  }
};
