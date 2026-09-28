import { Router } from 'express';
import { checkoutController } from '../../../controllers/checkout.controller.js';
import { authenticate } from '../../../middleware/auth.js';

const router = Router();

// All checkout operations require user authentication
router.use(authenticate);

router.get('/summary', checkoutController.getCheckoutSummary);

export default router;
