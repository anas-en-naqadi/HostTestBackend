import { z } from "zod";

// Enums
const lessonContentTypeEnum = z.enum(["text", "video", "quiz"], { required_error: "Lesson content type is required" });
const courseDifficultyEnum = z.enum(["beginner", "intermediate", "advanced", "allLevel"], { required_error: "Course difficulty is required" });

// Function to validate URLs accepted by react-plyr / Plyr
const isValidVideoUrl = (url: string): boolean => {
  if (typeof url !== 'string' || !url.trim()) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    // Not a valid URL
    return false;
  }

  // Only http(s) URLs
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false;
  }

  // Check for YouTube URLs
  const isYoutubeUrl = (
    parsed.hostname.includes('youtube.com') || 
    parsed.hostname.includes('youtu.be') ||
    parsed.hostname.includes('youtube-nocookie.com')
  );
  
  if (isYoutubeUrl) {
    return true;
  }
  
  // Allowed video file extensions for direct video files
  const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
  const path = parsed.pathname.toLowerCase();

  return videoExts.some(ext => path.endsWith(ext));
};



// Conditional validation for lesson content
export const lessonSchema = z.object({
  id: z.number({ required_error: "Lesson ID is required" }).int().positive("Lesson ID must be positive").optional(),
  title: z.string({ required_error: "Lesson title is required" }).min(1, "Lesson title is required"),
  content_type: lessonContentTypeEnum,
  video_url: z.string().optional().refine(
    (url) => !url || isValidVideoUrl(url), 
    { message: "Video URL must be a valid YouTube URL or video file URL (.mp4, .webm, .ogg, .mov, .mkv)" }
  ),
  lesson_text: z.string().optional(),
  quiz_id: z.number().int().positive().nullable().optional(),
  duration: z.number({ required_error: "Lesson duration is required" }).int().nonnegative("Duration must be zero or more"),
  order_position: z.number({ required_error: "Lesson Order position is required" }).int().nonnegative("Order position must be zero or more"),
  is_final_quiz: z.boolean().optional(), // Flag to mark a quiz as the final quiz
}).superRefine((data, ctx) => {
  switch (data.content_type) {
    case "video":
      if (!data.video_url && data.video_url !== "") {
        ctx.addIssue({
          path: ["video_url"],
          code: z.ZodIssueCode.custom,
          message: "video_url is required for video lessons, but doesn't need to be a valid URL"
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
    case "quiz":
      if (!data.quiz_id) {
        ctx.addIssue({
          path: ["quiz_id"],
          code: z.ZodIssueCode.custom,
          message: "quiz_id is required for quiz lessons"
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
  lessons: z.array(lessonSchema).min(1, "At least one lesson is required in each module"),
  is_final_module: z.boolean().optional() // Flag to mark the last module (containing the final quiz)
});

// Course Schema
const baseCourseSchema = z.object({
  id: z.number({ required_error: "Course ID is required" }).int().positive("Course ID must be positive").optional(),
  title: z.string({ required_error: "Course title is required" }).min(1, "Course title is required"),
  subtitle: z.string({ required_error: "Course subtitle is required" }).min(1, "Course subtitle is required"),
  description: z.string({ required_error: "Course description is required" }).min(1, "Course description is required"),
  what_you_will_learn: z.array(z.string(), { required_error: "Learning outcomes are required" }).min(1, "At least one learning outcome is required"),
  course_requirements: z.array(z.string(), { required_error: "Course requirements are required" }).min(1, "At least one course requirement is required"),
  instructor_id: z.number({ required_error: "Instructor ID is required" }).int().positive("Instructor ID must be positive"),
  category_id: z.number({ required_error: "Category ID is required" }).int().positive("Category ID must be positive"),
  thumbnail_url: z.string().optional(),
  slug: z.string({ required_error: "Slug is required" }).min(1, "Slug is required"),
  intro_video_url: z.string().optional().refine(
    (url) => !url || isValidVideoUrl(url),
    { message: "Intro video URL must be a valid YouTube URL or video file URL (.mp4, .webm, .ogg, .mov, .mkv)" }
  ),
  difficulty: courseDifficultyEnum,
  is_published: z.boolean().optional().default(false),
  modules: z.array(moduleSchema).min(1, "At least one module is required")
});

export const createCourseSchema = baseCourseSchema.superRefine((data, ctx) => {
  // Validate that the course has exactly one final quiz in the last module
  if (!data.modules || data.modules.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one module is required",
      path: ["modules"]
    });
    return;
  }
  
  // Get the last module
  const lastModule = data.modules[data.modules.length - 1];
  
  // Check if the last module has exactly one lesson
  if (!lastModule.lessons || lastModule.lessons.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The last module must contain exactly one lesson (the final quiz)",
      path: ["modules", data.modules.length - 1, "lessons"]
    });
    return;
  }
  
  // Check if the last module's only lesson is a quiz
  const lastLesson = lastModule.lessons[0];
  if (lastLesson.content_type !== "quiz") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The last module must contain a quiz lesson",
      path: ["modules", data.modules.length - 1, "lessons", 0, "content_type"]
    });
    return;
  }
  
  // Check if the quiz has a valid quiz_id
  if (!lastLesson.quiz_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The final quiz must be assigned a quiz ID",
      path: ["modules", data.modules.length - 1, "lessons", 0, "quiz_id"]
    });
    return;
  }
  
  // Check for any other final quizzes in other modules
  const finalQuizCount = data.modules.reduce((count, module, moduleIndex) => {
    return count + module.lessons.filter((lesson, lessonIndex) => {
      // Skip the last module's lesson, we already verified it's a quiz
      if (moduleIndex === data.modules.length - 1 && lessonIndex === 0) {
        return false;
      }
      return lesson.content_type === "quiz" && lesson.is_final_quiz === true;
    }).length;
  }, 0);
  
  if (finalQuizCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only the last module should contain a final quiz",
      path: ["modules"]
    });
    return;
  }

});

// Partial schema for updates
export const updateCourseSchema = baseCourseSchema.partial();