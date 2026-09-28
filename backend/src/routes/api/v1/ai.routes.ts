import { Router } from 'express';
import { aiController } from '../../../controllers/ai.controller.js';
import { optionalAuthenticate } from '../../../middleware/auth.js';

const router = Router();

router.get('/smart-search', optionalAuthenticate, (req, res, next) =>
  aiController.smartSearch(req, res, next)
);

router.post('/assistant/chat', optionalAuthenticate, (req, res, next) =>
  aiController.assistantChat(req, res, next)
);

router.get('/reviews/:productId/summary', (req, res, next) =>
  aiController.getReviewSummary(req, res, next)
);

export default router;
