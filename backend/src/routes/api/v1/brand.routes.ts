import { Router } from 'express';
import { brandController } from '../../../controllers/brand.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';

const router = Router();

// Public brand routes
router.get('/', (req, res, next) => brandController.getBrands(req, res, next));
router.get('/:slug', (req, res, next) => brandController.getBrandBySlug(req, res, next));

// Admin-only management write endpoints
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => brandController.createBrand(req, res, next));
router.patch('/:id', authenticate, authorize('ADMIN'), (req, res, next) => brandController.updateBrand(req, res, next));
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => brandController.deleteBrand(req, res, next));

export default router;
