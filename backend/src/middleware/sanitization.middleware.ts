import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    if (req.path.includes('/notes') || req.path.includes('/announcements')) {
      return next();
    }
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {}
        });
      }
    });
  }

  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeHtml(req.query[key] as string, {
          allowedTags: [],
          allowedAttributes: {}
        });
      }
    });
  }

  next();
}; 