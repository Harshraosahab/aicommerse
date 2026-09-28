import { Router } from 'express';
import { paymentController } from '../../../controllers/payment.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// Digital signature verification requires authenticated user session
router.post('/verify', authenticate, (req, res, next) => paymentController.verifyPayment(req, res, next));

// Webhook endpoint (verified cryptographically via header signature)
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));

export default router;