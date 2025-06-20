import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * A higher-order function to wrap async route handlers and catch errors.
 * This avoids the need for try-catch blocks in every async controller.
 * @param fn The async route handler function.
 * @returns A new RequestHandler that handles promise rejections.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
