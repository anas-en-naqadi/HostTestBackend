import { Response } from 'express';

/**
 * Helper function for successful responses
 * @param res Express response
 * @param data Response data
 * @param message Success message
 * @param statusCode HTTP status code
 * @returns Express response with success data
 */
export const successResponse = <T>(
  res: Response<ApiResponse<T>>,
  data: T,
  message?: string,
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    ...(message != null && { message }),
    ...(data != null && { data })
  });
};

/**
 * Helper function for error responses
 * @param res Express response
 * @param message Error message
 * @param statusCode HTTP status code
 * @param errors Additional error details
 * @returns Express response with error data
 */
export const errorResponse = <T>(
  res: Response<ApiResponse<T>>,
  message: string,
  statusCode: number = 500,
  errors?: any
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}; 


// API response type
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}