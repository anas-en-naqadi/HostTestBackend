// src/instructors/validations/instructor.validation.ts
import { z } from 'zod';

// Define the schema for creating an instructor
export const createInstructorSchema = z.object({
  user_id: z.number({required_error: "User ID is required"}).int().optional(),
  description: z.string({required_error: "Description is required"}).optional(),
  specialization: z.string({required_error: "Specialization is required"}).max(255).optional(),
});

// Define the schema for updating an instructor
export const updateInstructorSchema = createInstructorSchema.partial();

// Define the schema for fetching an instructor by ID
export const getInstructorSchema = z.object({
  id: z.number({required_error: "Instructor ID is required"}).int(),
});
