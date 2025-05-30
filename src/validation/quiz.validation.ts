import { z } from 'zod';

export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  duration_time: z.number().int().positive('Duration must be a positive integer'),
  questions: z.array(
    z.object({
      text: z.string().min(1, 'Question text is required'),
      options: z.array(
        z.object({
          text: z.string().min(1, 'Option text is required'),
          is_correct: z.boolean(),
        })
      ).min(2, 'At least two options are required'),
    })
  ).optional(),
});