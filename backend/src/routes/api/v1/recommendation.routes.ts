import { Router } from 'express';
import { recommendationController } from '../../../controllers/recommendation.controller.js';
import { optionalAuthenticate } from '../../../middleware/auth.js';

const router = Router();

router.get('/personalized', optionalAuthenticate, (req, res, next) =>
  recommendationController.getPersonalized(req, res, next)
);

router.get('/product/:productId', (req, res, next) =>
  recommendationController.getSimilar(req, res, next)
);

router.get('/trending', (req, res, next) =>
  recommendationController.getTrending(req, res, next)
);

export default router;
