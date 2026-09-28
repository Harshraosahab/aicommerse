import { Router } from 'express';
import { productController } from '../../../controllers/product.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';

const router = Router();

// Public catalog routes
router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/suggestions', (req, res, next) => productController.getSuggestions(req, res, next));
router.get('/:slug', (req, res, next) => productController.getProductBySlug(req, res, next));
router.get('/:slug/related', (req, res, next) => productController.getRelatedProducts(req, res, next));

// Admin-only management write endpoints
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => productController.createProduct(req, res, next));
router.patch('/:id', authenticate, authorize('ADMIN'), (req, res, next) => productController.updateProduct(req, res, next));
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => productController.deleteProduct(req, res, next));

export default router;
