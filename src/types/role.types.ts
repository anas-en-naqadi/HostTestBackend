export interface Role {
    id: number;
    name: string;
    description?: string;
  }
  
  export interface CreateRoleDto {
    name: string;
    description?: string;
  }
  export interface AssignPermissionDto {
    role_id: number;
    permission_id: number;
  }
  
  export interface UpdateRoleDto {
    name?: string;
    description?: string;
  }
  
  export interface RoleResponse {
    id: number;
    name: string;
    description?: string;
    permissions: {
      name: string;
    }[];
  }
  // apiResponse.types.ts
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
  }
  
  