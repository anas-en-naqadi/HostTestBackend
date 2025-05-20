export interface EnrollmentWithCourse {
    id: number;
    user_id: number;
    course_id: number;
    enrolled_at: Date | null;
    progress_percent: number | null;
    last_accessed_module_id: number | null;
    last_accessed_lesson_id: number | null;
    completed_at: Date | null;
    courses: {
      title: string;
      subtitle: string;
      thumbnail_url: string;
      slug: string;
      modules: Array<{
        lessons: Array<{
          lesson_progress: Array<unknown>;
        }>;
      }>;
      user: {
          full_name: string;
          instructors:object;
      };
    };
  }