import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = res.getHeader('x-request-id') as string | undefined;

  // 1. Handled AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${err.code}] ${err.message}`, {
        requestId,
        path: req.originalUrl,
        statusCode: err.statusCode,
        details: err.details,
        stack: err.stack,
      });
    }

    sendError(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details,
      env.NODE_ENV === 'development' ? err.stack : undefined
    );
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Request input validation failed',
      formattedErrors,
      env.NODE_ENV === 'development' ? err.stack : undefined
    );
    return;
  }

  // 3. Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 400, 'INVALID_IDENTIFIER', 'Invalid resource identifier format');
    return;
  }

  // 4. Mongoose Duplicate Key Error
  if ((err as any).code === 11000) {
    const fields = Object.keys((err as any).keyValue || {});
    sendError(
      res,
      409,
      'DUPLICATE_KEY_ERROR',
      `Resource with specified ${fields.join(', ')} already exists`,
      (err as any).keyValue
    );
    return;
  }

  // 5. Unhandled / Unexpected Errors (500)
  logger.error('Unhandled internal server error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error';

  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    message,
    undefined,
    env.NODE_ENV === 'development' ? err.stack : undefined
  );
}
