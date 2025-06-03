import { Request, Response, NextFunction } from 'express';
import sanitizeHtml, { IOptions } from 'sanitize-html';

// Define fields that are allowed to contain HTML content
interface AllowedHtmlFields {
  [path: string]: string[];
}

// Whitelist of fields allowed to contain HTML by endpoint path pattern
const htmlAllowedFields: AllowedHtmlFields = {
  '/notes': ['content'],
  '/announcements': ['content'],
  '/courses': ['lesson_text'],
  '/users': ['description']
};

// Strict sanitization (no HTML allowed)
const strictSanitizeOptions: IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard' as const
};

// Recursively sanitize nested objects and arrays
function sanitizeValue(value: any, isHtmlAllowed: boolean = false): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle strings - this is where the actual sanitization happens
  if (typeof value === 'string') {
    // If HTML is allowed, return the value as is without sanitization
    if (isHtmlAllowed) {
      return value; // Accept HTML directly without sanitization
    }
    // Otherwise apply strict sanitization
    return sanitizeHtml(value, strictSanitizeOptions);
  }
  
  // Handle arrays - recursively sanitize each element
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, false)); // Arrays generally shouldn't contain HTML
  }
  
  // Handle objects - recursively sanitize each property
  if (typeof value === 'object') {
    const sanitized: any = {};
    Object.keys(value).forEach(key => {
      sanitized[key] = sanitizeValue(value[key], false); // Nested objects default to strict sanitization
    });
    return sanitized;
  }
  
  // Handle other types (numbers, booleans, etc.) - return as-is
  return value;
}

/**
 * Middleware that sanitizes request data to prevent XSS attacks
 * 
 * This middleware sanitizes request body, query parameters, and URL parameters
 * to prevent Cross-Site Scripting (XSS) attacks. It allows HTML content only in
 * specific fields from specific endpoints, as defined in the htmlAllowedFields map.
 * 
 * All other content is strictly sanitized to remove any HTML or script content.
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Find which whitelist to apply based on the request path
    const matchingPath = Object.keys(htmlAllowedFields).find(path => req.path.includes(path));
    const exemptFields = matchingPath ? htmlAllowedFields[matchingPath] : [];

    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && exemptFields.length > 0) {
      console.log(`🧼 Sanitizer: Allowing HTML in [${exemptFields.join(', ')}] for path: ${req.path}`);
    }
    
    // Sanitize request body (handles nested objects and arrays)
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        const isHtmlAllowed = exemptFields.includes(key);
        
        if (typeof req.body[key] === 'string') {
          if (isHtmlAllowed) {
            // For HTML-allowed fields, skip sanitization entirely
            if (process.env.NODE_ENV === 'development') {
              console.log(`🧼 Sanitizer: Bypassing sanitization for HTML field [${key}]`);
            }
            // HTML field - leave as is
          } else {
            // For regular fields, apply strict sanitization
            req.body[key] = sanitizeValue(req.body[key], false);
          }
        } else {
          // For non-string values, just sanitize normally
          req.body[key] = sanitizeValue(req.body[key], isHtmlAllowed);
        }
      });
    }

    // Sanitize query parameters (never allow HTML in query params)
    if (req.query && typeof req.query === 'object') {
      Object.keys(req.query).forEach(key => {
        const queryValue = req.query[key];
        
        if (typeof queryValue === 'string') {
          req.query[key] = sanitizeHtml(queryValue, strictSanitizeOptions);
        } else if (Array.isArray(queryValue)) {
          // Handle query parameter arrays like ?tags=tag1&tags=tag2
          req.query[key] = queryValue.map(item => {
            if (typeof item === 'string') {
              return sanitizeHtml(item, strictSanitizeOptions);
            }
            return item;
          });
        }
      });
    }

    // Sanitize URL parameters (never allow HTML in URL params)
    if (req.params && typeof req.params === 'object') {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeHtml(req.params[key], strictSanitizeOptions);
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error in XSS sanitization middleware:', error);
    next(error);
  }
};