import { z } from "zod";

// Enums
const lessonContentTypeEnum = z.enum(["text", "video", "quiz"], { required_error: "Lesson content type is required" });
const courseDifficultyEnum = z.enum(["beginner", "intermediate", "advanced", "allLevel"], { required_error: "Course difficulty is required" });

// Conditional validation for lesson content
export const lessonSchema = z.object({
  id: z.number({ required_error: "Lesson ID is required" }).int().positive("Lesson ID must be positive").optional(),
  title: z.string({ required_error: "Lesson title is required" }).min(1, "Lesson title is required"),
  content_type: lessonContentTypeEnum,
  video_url: z.string().url("Valid video URL is required").optional(),
  lesson_text: z.string().optional(),
  quiz_id: z.number({ required_error: "Quiz ID is required" }).int().positive().optional(),
  duration: z.number({ required_error: "Lesson duration is required" }).int().nonnegative("Duration must be zero or more"),
  order_position: z.number({ required_error: "Lesson Order position is required" }).int().nonnegative("Order position must be zero or more"),
}).superRefine((data, ctx) => {
  switch (data.content_type) {
    case "video":
      if (!data.video_url) {
        ctx.addIssue({
          path: ["video_url"],
          code: z.ZodIssueCode.custom,
          message: "video_url is required for video lessons"
        });
      }
      break;
    case "text":
      if (!data.lesson_text) {
        ctx.addIssue({
          path: ["lesson_text"],
          code: z.ZodIssueCode.custom,
          message: "lesson_text is required for text lessons"
        });
      }
      break;
  
  }
});

// Module Schema
export const moduleSchema = z.object({
  id: z.number({ required_error: "Module ID is required" }).int().positive("Module ID must be positive").optional(),
  title: z.string({ required_error: "Module title is required" }).min(1, "Module title is required"),
  order_position: z.number({ required_error: "Module Order position is required" }).int().nonnegative("Order position must be zero or more"),
  lessons: z.array(lessonSchema).min(1, "At least one lesson is required in each module")
});

// Course Schema
export const createCourseSchema = z.object({
  id: z.number({ required_error: "Course ID is required" }).int().positive("Course ID must be positive").optional(),
  title: z.string({ required_error: "Course title is required" }).min(1, "Course title is required"),
  description: z.string({ required_error: "Course description is required" }).min(1, "Course description is required"),
  what_you_will_learn: z.array(z.string(), { required_error: "Learning outcomes are required" }),
  course_requirements: z.array(z.string(), { required_error: "Course requirements are required" }),
  instructor_id: z.number({ required_error: "Instructor ID is required" }).int().positive("Instructor ID must be positive"),
  category_id: z.number({ required_error: "Category ID is required" }).int().positive("Category ID must be positive"),
  thumbnail_url: z.string({ required_error: "A valid thumbnail URL is required" }).url("A valid thumbnail URL is required"),
  slug: z.string({ required_error: "Slug is required" }).min(1, "Slug is required"),
  intro_video_url: z.string({ required_error: "A valid intro video URL is required" }).url("A valid intro video URL is required"),
  difficulty: courseDifficultyEnum,
  subtitle: z.string().optional(),
  modules: z.array(moduleSchema).min(1, "At least one module is required")
});

// Partial schema for updates
export const updateCourseSchema = createCourseSchema.partial();
