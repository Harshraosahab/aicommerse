import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Brand } from '../models/brand.model.js';
import { FAQ } from '../models/faq.model.js';
import { env } from '../config/env.js';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapService {
  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case '\'':
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  /**
   * Build XML string from list of URLs
   */
  private buildXml(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const u of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(u.loc)}</loc>\n`;
      if (u.lastmod) {
        xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
      }
      if (u.changefreq) {
        xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      }
      if (u.priority !== undefined) {
        xml += `    <priority>${u.priority.toFixed(1)}</priority>\n`;
      }
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generates dynamic sitemap from active database records
   */
  async generateSitemapXml(customBaseUrl?: string): Promise<string> {
    const rawOrigin = customBaseUrl || env.CORS_ORIGIN.split(',')[0].trim();
    const baseUrl = (rawOrigin === '*' || !rawOrigin) ? 'https://nexuscommerce.com' : rawOrigin.replace(/\/+$/, '');

    const nowIso = new Date().toISOString().split('T')[0];

    // 1. Static Core Public Pages (Home, Catalog, Categories, Help)
    const urls: SitemapUrl[] = [
      {
        loc: `${baseUrl}/`,
        lastmod: nowIso,
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${baseUrl}/products`,
        lastmod: nowIso,
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/categories`,
        lastmod: nowIso,
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/help`,
        lastmod: nowIso,
        changefreq: 'weekly',
        priority: 0.6,
      },
    ];

    // 2. Active Products
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    for (const p of products) {
      if (p.slug) {
        const lastmodDate = (p.updatedAt || p.createdAt || new Date()).toISOString().split('T')[0];
        urls.push({
          loc: `${baseUrl}/products/${p.slug}`,
          lastmod: lastmodDate,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }

    // 3. Active Categories
    const categories = await Category.find({ isActive: true })
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    for (const c of categories) {
      if (c.slug) {
        const lastmodDate = (c.updatedAt || c.createdAt || new Date()).toISOString().split('T')[0];
        urls.push({
          loc: `${baseUrl}/category/${c.slug}`,
          lastmod: lastmodDate,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }

    // 4. Active Brands
    const brands = await Brand.find({ isActive: true })
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    for (const b of brands) {
      if (b.slug) {
        const lastmodDate = (b.updatedAt || b.createdAt || new Date()).toISOString().split('T')[0];
        urls.push({
          loc: `${baseUrl}/brand/${b.slug}`,
          lastmod: lastmodDate,
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    }

    // 5. Published FAQs / Help Articles
    const faqs = await FAQ.find({ isPublished: true })
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    for (const f of faqs) {
      if (f.slug) {
        const lastmodDate = (f.updatedAt || f.createdAt || new Date()).toISOString().split('T')[0];
        urls.push({
          loc: `${baseUrl}/help/${f.slug}`,
          lastmod: lastmodDate,
          changefreq: 'monthly',
          priority: 0.5,
        });
      }
    }

    return this.buildXml(urls);
  }

  /**
   * Generates robots.txt directives
   */
  generateRobotsTxt(customBaseUrl?: string): string {
    const rawOrigin = customBaseUrl || env.CORS_ORIGIN.split(',')[0].trim();
    const baseUrl = (rawOrigin === '*' || !rawOrigin) ? 'https://nexuscommerce.com' : rawOrigin.replace(/\/+$/, '');

    return `# Robots.txt for Nexus Commerce
User-agent: *

# Disallow private user & administrative operations
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Disallow: /orders/
Disallow: /profile
Disallow: /notifications/
Disallow: /support/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password/
Disallow: /order-success/
Disallow: /payment-failure
Disallow: /api/

# Allow public crawl discovery
Allow: /
Allow: /products
Allow: /category/
Allow: /brand/
Allow: /help

# Dynamic Sitemap Reference
Sitemap: ${baseUrl}/sitemap.xml
`;
  }
}

export const sitemapService = new SitemapService();
