import { Router } from 'express';
import { FAQController } from '../../../controllers/faq.controller.js';
import { validate } from '../../../middleware/validate.js';
import { getFAQQuerySchema } from '../../../validators/faq.validator.js';

const router = Router();

// Publicly readable FAQ routes
router.get('/', validate(getFAQQuerySchema), FAQController.getPublishedFAQs);
router.get('/:slug', FAQController.getFAQBySlug);

export default router;
