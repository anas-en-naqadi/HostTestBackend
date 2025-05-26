// src/types/category.types.ts

/**
 * Standard API envelope
 */
// types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}


/**
 * What we send back to clients for a Category
 */
export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  createdBy?: number;
  creatorName?: string;
  courseCount?: number;
}

/**
 * DTO for creating a Category
 */
export interface CreateCategoryDto {
  name: string;
}

/**
 * DTO for updating a Category
 */
export interface UpdateCategoryDto {
  name?: string;
}
