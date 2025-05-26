// src/validation/category.validation.ts

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string({required_error: "Name is required"}).min(1, 'Name is required').max(50, 'Name must be ≤50 chars'),
});

export const updateCategorySchema = z.object({
  name: z.string({required_error: "Name is required"}).min(1, 'Name cannot be empty').max(50, 'Name must be ≤50 chars'),
});

export const getCategorySchema = z.object({
  slug: z.string({required_error: "Slug is required"}).min(1, 'Slug is required'),
});



