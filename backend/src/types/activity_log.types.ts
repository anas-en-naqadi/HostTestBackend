// src/types/activityLog.types.ts
// src/types/activity_log.types.ts

export interface ActivityLogResponse {
    id: number;
    activity_type: string;
    details?: string;
    ip_address?: string;
    created_at: Date;
    actor_full_name: string;
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

