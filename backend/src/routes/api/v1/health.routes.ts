import { Router } from 'express';
import { HealthController } from '../../../controllers/health.controller.js';

const router = Router();

router.get('/health', (req, res) => HealthController.getHealth(req, res));
router.get('/health/live', (req, res) => HealthController.getLiveness(req, res));
router.get('/health/ready', (req, res) => HealthController.getReadiness(req, res));
router.get('/health/metrics', (req, res) => HealthController.getMetrics(req, res));

export default router;
