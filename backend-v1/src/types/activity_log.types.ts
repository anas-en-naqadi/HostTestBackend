// src/types/activityLog.types.ts

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface ActivityLogResponse {
  id: number;
  activity_type: string;
  details?: string;
  ip_address?: string;
  created_at: Date;
  actor_full_name: string;
  actor_role: string;
}

export interface ActivityLogRequest {
  user_id: number;
  activity_type: string;
  details?: string;
  ip_address?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
