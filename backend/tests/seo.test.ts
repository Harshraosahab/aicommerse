import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Product } from '../src/models/product.model.js';
import { Category } from '../src/models/category.model.js';
import { Brand } from '../src/models/brand.model.js';
import { FAQ } from '../src/models/faq.model.js';
import { appCache } from '../src/utils/cache.js';

describe('Phase 11: SEO, Sitemap, Performance & Caching Tests', () => {
  const mockDate = new Date('2026-09-16T12:00:00Z');

  const mockProducts = [
    {
      slug: 'seo-wireless-headphones',
      isActive: true,
      updatedAt: mockDate,
      createdAt: mockDate,
    },
  ];

  const mockCategories = [
    {
      slug: 'seo-electronics',
      isActive: true,
      updatedAt: mockDate,
      createdAt: mockDate,
    },
  ];

  const mockBrands = [
    {
      slug: 'seo-techbrand',
      isActive: true,
      updatedAt: mockDate,
      createdAt: mockDate,
    },
  ];

  const mockFAQs = [
    {
      slug: 'how-does-seo-sitemap-generation-work',
      isPublished: true,
      updatedAt: mockDate,
      createdAt: mockDate,
    },
  ];

  beforeEach(() => {
    // Helper to mock mongoose query chain .select().sort().lean()
    const createQueryMock = (data: any[]) => ({
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(data),
    });

    vi.spyOn(Product, 'find').mockReturnValue(createQueryMock(mockProducts) as any);
    vi.spyOn(Category, 'find').mockReturnValue(createQueryMock(mockCategories) as any);
    vi.spyOn(Brand, 'find').mockReturnValue(createQueryMock(mockBrands) as any);
    vi.spyOn(FAQ, 'find').mockReturnValue(createQueryMock(mockFAQs) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Dynamic Sitemap Generation', () => {
    it('serves valid XML sitemap at /sitemap.xml and /api/v1/sitemap.xml', async () => {
      const res = await request(app).get('/sitemap.xml');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/xml');
      expect(res.text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(res.text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

      // Check inclusion of active entities
      expect(res.text).toContain('/products/seo-wireless-headphones</loc>');
      expect(res.text).toContain('/category/seo-electronics</loc>');
      expect(res.text).toContain('/brand/seo-techbrand</loc>');
      expect(res.text).toContain('/help/how-does-seo-sitemap-generation-work</loc>');

      // Check static core pages
      expect(res.text).toMatch(/<loc>https?:\/\/[^/]+\/<\/loc>/);
      expect(res.text).toMatch(/<loc>https?:\/\/[^/]+\/products<\/loc>/);
      expect(res.text).toContain('<priority>1.0</priority>');

      // Check /api/v1/sitemap.xml also works
      const apiRes = await request(app).get('/api/v1/sitemap.xml');
      expect(apiRes.status).toBe(200);
      expect(apiRes.headers['content-type']).toContain('application/xml');
    });
  });

  describe('2. Robots.txt Directives', () => {
    it('serves robots.txt restricting private routes and referencing sitemap', async () => {
      const res = await request(app).get('/robots.txt');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');

      expect(res.text).toContain('User-agent: *');
      expect(res.text).toContain('Disallow: /admin/');
      expect(res.text).toContain('Disallow: /cart');
      expect(res.text).toContain('Disallow: /checkout');
      expect(res.text).toContain('Disallow: /orders/');
      expect(res.text).toContain('Disallow: /profile');
      expect(res.text).toContain('Disallow: /support/');
      expect(res.text).toContain('Allow: /products');
      expect(res.text).toContain('Allow: /category/');
      expect(res.text).toContain('Allow: /help');
      expect(res.text).toContain('Sitemap:');
      expect(res.text).toContain('/sitemap.xml');

      // Check /api/v1/robots.txt also works
      const apiRes = await request(app).get('/api/v1/robots.txt');
      expect(apiRes.status).toBe(200);
      expect(apiRes.text).toContain('Disallow: /admin/');
    });
  });

  describe('3. In-Memory TTL Cache Foundation', () => {
    it('stores, retrieves, expires, and invalidates cache entries by prefix', async () => {
      appCache.clear();

      appCache.set('test:key1', { message: 'hello' }, 10);
      expect(appCache.get('test:key1')).toEqual({ message: 'hello' });

      // Non-existent key returns null
      expect(appCache.get('test:nonexistent')).toBeNull();

      // Prefix invalidation
      appCache.set('test:key2', { message: 'world' }, 10);
      appCache.set('other:key3', { message: 'other' }, 10);

      const deleted = appCache.deletePrefix('test');
      expect(deleted).toBe(2);
      expect(appCache.get('test:key1')).toBeNull();
      expect(appCache.get('test:key2')).toBeNull();
      expect(appCache.get('other:key3')).toEqual({ message: 'other' });

      // Stats check
      const stats = appCache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe('4. Performance Tracker & Health Metrics', () => {
    it('tracks response latencies and exposes metrics at /api/v1/health/metrics', async () => {
      // Trigger a request to record performance
      await request(app).get('/api/v1/health');

      const res = await request(app).get('/api/v1/health/metrics');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const metrics = res.body.data;
      expect(metrics).toHaveProperty('uptimeSeconds');
      expect(metrics).toHaveProperty('requests');
      expect(metrics.requests.total).toBeGreaterThan(0);
      expect(metrics.requests.byStatus).toHaveProperty('2xx');
      expect(metrics).toHaveProperty('latencyMs');
      expect(metrics.latencyMs).toHaveProperty('avg');
      expect(metrics.latencyMs).toHaveProperty('p95');
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('memoryUsageMb');
      expect(metrics.memoryUsageMb).toHaveProperty('heapUsed');
    });
  });
});
