import { user_status } from "@prisma/client";

// User status enum
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}
export enum UserRole {
  ADMIN = "admin",
  INSTRUCTOR = "instructor",
  INTERN = "intern",
}
// User response type
export interface UserResponse {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  instructor?: Object | null;
  status: user_status;
  last_login: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  instructors?: object;
  
}

export interface UserBody {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  description: string;
  specialization: string;

  status: boolean;
}
