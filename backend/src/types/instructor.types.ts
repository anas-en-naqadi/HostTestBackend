export type CreateInstructorDto = {
  user_id: number;         // Required field: ID of the user associated with the instructor
  description?: string;    // Optional field: Description of the instructor's expertise or background
  specialization?: string; // Optional field: The area of specialization or expertise of the instructor
};

export type UpdateInstructorDto = Partial<CreateInstructorDto>; 
// Partial means that all fields are optional, which is suitable for update operations

export type InstructorResponse = {
  id: number;              // The unique identifier for the instructor
  user_id: number;         // Required field: ID of the user associated with the instructor
  specialization?: string; // Optional field: The area of specialization of the instructor
  description?: string;    // Optional field: A description of the instructor's expertise or background
};
export type InstructorsResponse = {
  id: number;              // The unique identifier for the user
  user_id: number;    
  full_name: string;
  email: string;      // The unique identifier for the instructor
  specialization?: string; // Optional field: The area of specialization of the instructor
  description?: string;    // Optional field: A description of the instructor's expertise or background
};


export interface ApiResponse<T> {
  success: boolean;         // Indicates if the operation was successful or not
  data?: T;                 // The data returned in the response (optional)
  message?: string;         // A message returned in the response (optional)
}
