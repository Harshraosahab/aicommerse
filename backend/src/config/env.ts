import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load .env: prioritize current working directory, then check parent directory, then backend/.env
dotenv.config();

const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '../.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT must be a valid port number (1-65535)',
    }),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required. Please provide a valid MongoDB connection string.',
    })
    .url({
      message: 'MONGODB_URI must be a valid URL starting with mongodb:// or mongodb+srv://',
    })
    .or(
      z.string().refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
        message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
      })
    ),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('1000')
    .transform((val) => parseInt(val, 10)),
  API_BASE_URL: z.string().default('http://localhost:5000/api/v1'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info'),
  JWT_SECRET: z
    .string()
    .min(16, { message: 'JWT_SECRET must be at least 16 characters' })
    .default('super-secret-jwt-key-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_EXPIRES_IN_DAYS: z
    .string()
    .default('7')
    .transform((val) => parseInt(val, 10)),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 587)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@ecommerce.local'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_CURRENCY: z.string().default('INR'),
  RETURN_WINDOW_DAYS: z
    .string()
    .default('14')
    .transform((val) => parseInt(val, 10)),
  MONGODB_MAX_POOL_SIZE: z
    .string()
    .default('50')
    .transform((val) => parseInt(val, 10)),
  MONGODB_MIN_POOL_SIZE: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10)),
  MONGODB_MAX_IDLE_TIME_MS: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    const message = `[FATAL] Environment configuration validation failed:\n${errorDetails}\nPlease check your .env file or environment variables.`;
    console.error(message);
    throw new Error(message);
  }

  // Production-specific hardening assertions
  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.JWT_SECRET === 'super-secret-jwt-key-change-in-production-min-32-chars') {
      const msg = '[FATAL] Production security violation: Default JWT_SECRET is not permitted in production.';
      console.error(msg);
      throw new Error(msg);
    }

    if (parsed.data.JWT_SECRET.length < 32) {
      const msg = '[FATAL] Production security violation: JWT_SECRET must be at least 32 characters long in production.';
      console.error(msg);
      throw new Error(msg);
    }

    if (
      parsed.data.MONGODB_URI.includes('localhost') ||
      parsed.data.MONGODB_URI.includes('127.0.0.1')
    ) {
      console.warn(
        '[WARN] Production configuration warning: MONGODB_URI points to localhost. Ensure a secure replica set or managed MongoDB instance is configured for production.'
      );
    }
  }

  return parsed.data;
}

export const env = validateEnv();
