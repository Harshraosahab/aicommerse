import { Request, Response, NextFunction } from 'express';

/**
 * Recursively cleanses an object by removing keys that start with '$' or contain '.'
 * to prevent NoSQL query operator injection attacks in MongoDB/Mongoose.
 */
export function cleanNoSqlInjection<T>(target: T): T {
  if (target === null || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => cleanNoSqlInjection(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(target)) {
    // Drop keys that start with '$' (Mongo operators) or contain '.' (path traversal/prototype injection)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      sanitized[key] = cleanNoSqlInjection(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 * against MongoDB operator injection.
 */
export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanNoSqlInjection(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = cleanNoSqlInjection(req.query);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = cleanNoSqlInjection(req.params);
  }

  next();
}
