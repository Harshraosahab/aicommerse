import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { interactionController } from '../../../controllers/interaction.controller.js';
import { optionalAuthenticate } from '../../../middleware/auth.js';

const router = Router();

// Dedicated rate limiter for telemetry tracking to prevent DDOS/flooding
const interactionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many interaction tracking events. Please slow down.',
    },
  },
});

router.post(
  '/',
  interactionRateLimiter,
  optionalAuthenticate,
  (req, res, next) => interactionController.trackInteraction(req, res, next)
);

export default router;
