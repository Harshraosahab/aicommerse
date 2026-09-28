import winston from 'winston';
import { env } from '../config/env.js';

// Sensitive keys to scrub from structured log objects
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'jwt',
  'authorization',
  'cookie',
  'creditcard',
  'cardNumber',
  'cvv',
  'apiKey',
  'key',
]);

function maskSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const redactFormat = winston.format((info) => {
  return maskSensitiveData(info);
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  redactFormat(),
  env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
      })
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ecommerce-backend' },
  transports: [
    new winston.transports.Console({
      silent: env.NODE_ENV === 'test',
    }),
  ],
});
