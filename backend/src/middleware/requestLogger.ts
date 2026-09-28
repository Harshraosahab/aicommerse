import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  // Attach request ID to response header
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    const logPayload = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: `${durationMs}ms`,
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.ip || req.socket.remoteAddress,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request failed with server error', logPayload);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request client error', logPayload);
    } else {
      logger.info('HTTP Request processed', logPayload);
    }
  });

  next();
}
