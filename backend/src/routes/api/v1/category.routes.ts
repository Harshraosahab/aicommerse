import { Router } from 'express';
import { categoryController } from '../../../controllers/category.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';

const router = Router();

// Public category routes
router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));
router.get('/:slug', (req, res, next) => categoryController.getCategoryBySlug(req, res, next));

// Admin-only management write endpoints
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.createCategory(req, res, next));
router.patch('/:id', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/:id', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.deleteCategory(req, res, next));

export default router;
