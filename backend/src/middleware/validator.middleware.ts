import { ZodError, AnyZodObject, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
/**
 * Generic Zod validator middleware
 */
export const validate =
  (schema: ZodSchema<any>, prop: 'body' | 'params' | 'query') =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req[prop]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
       
        next(new AppError(400, 'Validation error',err.errors));
      } else {
        next(err);
      }
    }
  };
  export const validateSlug = (req: Request, res: Response, next: NextFunction) =>  {
    const slug = req.params.slug;
  
    // Check if the slug is empty or only whitespace
    if (!slug.trim()) {
      return next(new AppError(400, 'Slug is required'));
    }
  
    // Regex to ensure only lowercase letters and hyphens are allowed
    const slugPattern = /^[a-z-]+$/;
    if (!slugPattern.test(slug)) {
      return next(new AppError(400, 'Slug must contain only lowercase letters and hyphens, without numbers'));
    }
  
    next();
  };