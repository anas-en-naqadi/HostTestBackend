import { z } from "zod";

// Enums
const lessonContentTypeEnum = z.enum(["text", "video", "quiz"], { required_error: "Lesson content type is required" });
const courseDifficultyEnum = z.enum(["beginner", "intermediate", "advanced", "allLevel"], { required_error: "Course difficulty is required" });

// Function to validate video URLs
const isValidVideoUrl = (url: string) => {
  if (!url) return false;
  
  try {
    // Check basic URL validity
    const parsedUrl = new URL(url);
    
    // Supported video platforms
    const supportedDomains = [
      'youtube.com', 'youtu.be', // YouTube
      'vimeo.com', // Vimeo
      'dailymotion.com', // Dailymotion
      'facebook.com', 'fb.watch', // Facebook Video
      'twitch.tv', // Twitch
      'wistia.com', // Wistia
      'loom.com', // Loom
      'drive.google.com', // Google Drive
      'player.vimeo.com',
      'fast.wistia.net',
      'player.twitch.tv'
    ];
    
    // Check if URL is from a supported video platform
    return supportedDomains.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch (_) {
    return false;
  }
};

// Conditional validation for lesson content
export const lessonSchema = z.object({
  id: z.number({ required_error: "Lesson ID is required" }).int().positive("Lesson ID must be positive").optional(),
  title: z.string({ required_error: "Lesson title is required" }).min(1, "Lesson title is required"),
  content_type: lessonContentTypeEnum,
  video_url: z.string().optional().refine(
    (url) => !url || isValidVideoUrl(url), 
    { message: "Video URL must be from a supported platform (YouTube, Vimeo, etc.)" }
  ),
  lesson_text: z.string().optional(),
  quiz_id: z.number().int().positive().nullable().optional(),
  duration: z.number({ required_error: "Lesson duration is required" }).int().nonnegative("Duration must be zero or more"),
  order_position: z.number({ required_error: "Lesson Order position is required" }).int().nonnegative("Order position must be zero or more"),
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
    { message: "Intro video URL must be from a supported platform (YouTube, Vimeo, etc.)" }
  ),
  difficulty: courseDifficultyEnum,
  is_published: z.boolean().optional().default(false),
  modules: z.array(moduleSchema).min(1, "At least one module is required")
});

// Partial schema for updates
export const updateCourseSchema = createCourseSchema.partial();