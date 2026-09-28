import { Router } from 'express';
import { authController } from '../../../controllers/auth.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { authLimiter } from '../../../middleware/security.js';


const router = Router();

// Public auth endpoints (with stricter rate limiting)
router.post('/register', authLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password/:token', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));
router.get('/verify-email/:token', (req, res, next) => authController.verifyEmail(req, res, next));

// Protected auth endpoints
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));

export default router;
