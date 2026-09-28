import { Request, Response, NextFunction } from 'express';
import { sitemapService } from '../services/sitemap.service.js';

export class SitemapController {
  async getSitemap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.get('host');
      const protocol = req.protocol;
      const customBase = host ? `${protocol}://${host}` : undefined;

      const xml = await sitemapService.generateSitemapXml(customBase);
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600'); // 1 hour cache
      res.status(200).send(xml);
    } catch (error) {
      next(error);
    }
  }

  getRobots(req: Request, res: Response, next: NextFunction): void {
    try {
      const host = req.get('host');
      const protocol = req.protocol;
      const customBase = host ? `${protocol}://${host}` : undefined;

      const txt = sitemapService.generateRobotsTxt(customBase);
      res.header('Content-Type', 'text/plain');
      res.header('Cache-Control', 'public, max-age=86400'); // 24 hours cache
      res.status(200).send(txt);
    } catch (error) {
      next(error);
    }
  }
}

export const sitemapController = new SitemapController();
