import { z } from 'zod';

// Validation for creating a role
export const createRoleValidation = z.object({
  name: z.string({required_error: "Name is required"}).max(50, "Name must be at most 50 characters").min(1, "Name is required"),
  description: z.string({required_error: "Description is required"}).max(255).optional(),
});

// Validation for updating a role
export const updateRoleValidation = z.object({
  name: z.string({required_error: "Name is required"}).max(50, "Name must be at most 50 characters").optional(),
  description: z.string({required_error: "Description is required"}).max(255).optional(),
});




const permissionItemSchema = z.object({
  role_id: z.number({required_error: "Role ID is required"}).nonnegative("Role ID must be a positive number"),
  permission_id: z.number({required_error: "Permission ID is required"}).nonnegative("Permission ID must be a positive number")
});
export const assignPermissionValidation = z.array(permissionItemSchema);  
export const revokePermissionValidation = z.array(permissionItemSchema);



