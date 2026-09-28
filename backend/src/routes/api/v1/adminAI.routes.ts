import { Router } from 'express';
import { adminAIController } from '../../../controllers/admin/adminAI.controller.js';
import { authenticate, requireAdmin, authorizePermission } from '../../../middleware/auth.js';

const router = Router();

// Require admin privileges
router.use(authenticate, requireAdmin);

router.post(
  '/product/analyze',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminAIController.analyzeProduct(req, res, next)
);

router.post(
  '/product/description',
  authorizePermission('MANAGE_PRODUCTS'),
  (req, res, next) => adminAIController.draftDescription(req, res, next)
);

router.get(
  '/overview',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminAIController.getOverview(req, res, next)
);

router.get(
  '/customers/segments',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminAIController.getCustomerSegmentation(req, res, next)
);

router.get(
  '/inventory/insights',
  authorizePermission('VIEW_ANALYTICS'),
  (req, res, next) => adminAIController.getInventoryInsights(req, res, next)
);

router.get(
  '/reviews/moderation',
  authorizePermission('MANAGE_REVIEWS'),
  (req, res, next) => adminAIController.getModerationQueue(req, res, next)
);

export default router;
