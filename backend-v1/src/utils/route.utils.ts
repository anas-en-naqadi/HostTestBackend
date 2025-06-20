import { Request, Response, NextFunction, RequestHandler } from 'express';
import { MulterRequest } from '../types/multer.types';

/**
 * Helper function to convert MulterRequest handlers to Express RequestHandler
 * This resolves TypeScript compatibility issues between Express and Multer
 */
export const asRequestHandler = (
  handler: (req: MulterRequest, res: Response, next?: NextFunction | undefined) => Promise<any> | any
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as MulterRequest, res, next);
  };
};
