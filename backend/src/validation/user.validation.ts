import { UserRole } from "../types/user.types";
import { z } from "zod";

// Base user schema with common fields
const baseUserSchema = {
  full_name: z
    .string({ required_error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(255, "Full name cannot exceed 255 characters")
    .trim(),
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(255, "Username cannot exceed 255 characters")
  .regex(
  /^[a-zA-Z0-9_@]+$/,
  "Username can only contain letters, numbers, underscores, and @"
)

    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters")
    .trim(),
  status: z.boolean({ required_error: "Status is required" }),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Role is required" }),
  }),
};

// Create user schema
export const createUserSchema = z.object({
  ...baseUserSchema,
 description: z.string({required_error: "Description is required"}).optional(),
  specialization: z.string({required_error: "Specialization is required"}).max(255).optional(),
});

// Update user schema (all fields optional)
export const updateUserSchema = z
  .object({
    ...baseUserSchema,
  })
  .partial();

// Validation schema for profile update
export const updateProfileSchema = z
  .object({
    
    full_name: z
      .string({ required_error: "Full name is required" })
      .min(8, "Full name must be at least 2 characters")
      .max(255, "Full name cannot exceed 255 characters")
      .optional(),
    current_password: z
      .string({ required_error: "Current password is required" })
      .min(8, "Current password must be at least 6 characters")
      .optional(),
    new_password: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 6 characters")
      .optional(),
    password_confirmation: z
      .string({ required_error: "Password confirmation is required" })
      .min(8, "Password confirmation must be at least 6 characters")
      .optional(),
  })
  .refine(
    (data) => {
      // If new_password is provided, current_password and password_confirmation must also be provided
      if (data.new_password) {
        return !!data.current_password && !!data.password_confirmation;
      }
      return true;
    },
    {
      message:
        "Current password and password confirmation are required when updating password",
      path: ["current_password"],
    }
  )
  .refine(
    (data) => {
      // If new_password is provided, it must match password_confirmation
      if (data.new_password && data.password_confirmation) {
        return data.new_password === data.password_confirmation;
      }
      return true;
    },
    {
      message: "New password and confirmation do not match",
      path: ["password_confirmation"],
    }
  );

export const UserUpdateSchema = z
  .object({
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username is required"),
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: "Role is required" }),
    }),
    status: z.boolean({ required_error: "Status is required" }),
    description: z.string().max(500, "Too long").optional(),
    specialization: z.string().max(200, "Too long").optional(),
  })
  .strict();

// TypeScript types derived from the schemas
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
