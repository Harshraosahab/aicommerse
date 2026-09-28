import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed values back so transformations take effect
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) (req as any).query = parsed.query;
      if (parsed.params) (req as any).params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || 'Validation error';
        return next(new AppError(message, 400, 'VALIDATION_ERROR', error.issues));
      }
      next(error);
    }
  };
};
