export interface NotificationResponse {
    id: number;
    full_name: string;
    title: string;
    type: string;
    content?: string;
    metadata?: any;
    is_read: boolean;
    created_at: Date;
    read_at?: Date;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
  }

   interface BaseNotificationDto {
    title: string;
    type: string;
    content?: string;
    metadata?: any;
  }
  
  // Extend the base notification DTO in SendNotificationDto to include user_id
  export interface SendNotificationDto extends BaseNotificationDto {
    user_id: number;
  }
  
  // Optional user_id for sending notifications to admins
  export interface SendNotificationToAdminsDto extends BaseNotificationDto {
    user_id?: number; // Optional user_id, not required for sending to all admins
  }
  