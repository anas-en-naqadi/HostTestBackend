import { course_difficulty } from "@prisma/client";

export enum lesson_content_type {
  TEXT = "text",
  VIDEO = "video",
  QUIZ = "quiz",
}
// Lesson DTO for creating a lesson
export interface CreateLessonDto {
  id?: number;
  title: string;
  content_type: lesson_content_type;
  video_url?: string;
  lesson_text?: string;
  duration: number;
  quiz_id?: number;
  order_position: number;
}

// Module DTO for creating a module
export interface CreateModuleDto {
  id?: number;
  title: string;
  order_position: number;
  lessons: CreateLessonDto[];
}

// Course DTO for creating a course
export interface CreateCourseDto {
  title: string;
  description: string;
  what_you_will_learn: any;
  course_requirements: any;
  instructor_id: number;
  category_id: number;
  thumbnail_url: string;
  slug: string;
  intro_video_url: string;
  difficulty: course_difficulty;
  subtitle?: string;
  is_published?: boolean;
  modules: CreateModuleDto[];
}

// Course response (for API return)
export interface CourseResponse {
  id: number;
  title: string;
  slug: string;
  total_duration: number;
  subtitle: string;
  thumbnail_url: string;
  created_at: Date;
  is_published?: boolean;
  isInWishList: boolean; // Added
}
export interface DashboradCourseDTO {
  id: number;
  title: string;
  thumbnail: string;
  difficulty: string;
  duration: number;
  slug: string;
  instructorName: string;
  isInWishList: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  content_type: string;
  duration: number;
  order_position: number;
}

export interface Module {
  id: number;
  title: string;
  duration: number;
  order_position:number;
  lessons: Lesson[];
}
