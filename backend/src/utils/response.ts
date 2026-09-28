import { Response } from 'express';

export interface ApiResponseSuccess<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

export type ApiResponse<T = any> = ApiResponseSuccess<T> | ApiResponseError;

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): Response {
  const payload: ApiResponseSuccess<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
  stack?: string
): Response {
  const payload: ApiResponseError = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(stack ? { stack } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
