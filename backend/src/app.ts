import express, { Express } from 'express';
import compression from 'compression';
import { configureSecurity } from './middleware/security.js';
import { requestLogger } from './middleware/requestLogger.js';
import { performanceMiddleware } from './middleware/performanceTracker.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { sitemapController } from './controllers/sitemap.controller.js';
import v1Router from './routes/api/v1/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy headers when deployed behind reverse proxy/load balancers
  app.set('trust proxy', 1);

  // 2. HTTP response compression (gzip / deflate)
  app.use(compression());

  // 3. Performance tracking & latency metric hooks
  app.use(performanceMiddleware);

  // 4. Configure baseline security (Helmet, CORS, Rate limiting, body size caps)
  configureSecurity(app);

  // 5. Structured HTTP request logging with correlation IDs
  app.use(requestLogger);

  // 6. Root SEO Endpoints (direct crawler access)
  app.get('/sitemap.xml', (req, res, next) => sitemapController.getSitemap(req, res, next));
  app.get('/robots.txt', (req, res, next) => sitemapController.getRobots(req, res, next));

  // 7. Mount API v1 routes
  app.use('/api/v1', v1Router);

  // 8. Unmatched route handling (404)
  app.use(notFoundHandler);

  // 9. Centralized error handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
