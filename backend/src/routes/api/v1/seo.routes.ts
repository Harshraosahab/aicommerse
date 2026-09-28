import { Router } from 'express';
import { sitemapController } from '../../../controllers/sitemap.controller.js';

const router = Router();

// Sitemap and Robots routes under /api/v1
router.get('/sitemap.xml', (req, res, next) => sitemapController.getSitemap(req, res, next));
router.get('/robots.txt', (req, res, next) => sitemapController.getRobots(req, res, next));

export default router;
