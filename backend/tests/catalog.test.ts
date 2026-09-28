import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { productService } from '../src/services/product.service.js';
import { categoryService } from '../src/services/category.service.js';
import { brandService } from '../src/services/brand.service.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { AppError } from '../src/utils/errors.js';

describe('Phase 4 Product Catalog & Discovery API Unit/Integration Tests', () => {
  describe('GET /api/v1/products', () => {
    it('returns 200 with paginated product array and pagination metadata', async () => {
      const spy = vi.spyOn(productService, 'getProducts').mockResolvedValueOnce({
        items: [
          {
            _id: 'prod-1' as any,
            name: 'Test Running Shoes',
            slug: 'test-running-shoes',
            price: 120,
            stock: 15,
            SKU: 'SHOE-001',
            rating: 4.8,
            reviewCount: 24,
            isActive: true,
            isFeatured: true,
            isNewArrival: true,
            isBestseller: false,
            images: [{ url: 'https://example.com/shoes.jpg', isPrimary: true }],
            brand: { _id: 'b1' as any, name: 'Nike', slug: 'nike' } as any,
            category: { _id: 'c1' as any, name: 'Shoes', slug: 'shoes' } as any,
          } as any,
        ],
        pagination: {
          page: 1,
          limit: 20,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const res = await request(app).get('/api/v1/products?page=1&limit=20');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Test Running Shoes');
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.totalItems).toBe(1);

      spy.mockRestore();
    });

    it('rejects unreasonable limits exceeding 100 with validation error', async () => {
      const res = await request(app).get('/api/v1/products?limit=5000');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unsupported sorting values not on the allowlist', async () => {
      const res = await request(app).get('/api/v1/products?sort=malicious_sort');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/products/suggestions', () => {
    it('returns suggestions for matching search queries', async () => {
      const spy = vi.spyOn(productService, 'getSearchSuggestions').mockResolvedValueOnce({
        products: [{ name: 'iPhone 17 Pro', slug: 'iphone-17-pro' }],
        categories: [{ name: 'Phones', slug: 'phones' }],
        brands: [{ name: 'Apple', slug: 'apple' }],
      });

      const res = await request(app).get('/api/v1/products/suggestions?q=iph');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products.length).toBe(1);
      expect(res.body.data.products[0].name).toBe('iPhone 17 Pro');

      spy.mockRestore();
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('returns product details by slug', async () => {
      const spy = vi.spyOn(productService, 'getProductBySlug').mockResolvedValueOnce({
        _id: 'p1' as any,
        name: '4K OLED Smart TV',
        slug: '4k-oled-smart-tv',
        price: 1299.99,
        stock: 8,
        SKU: 'TV-OLED-01',
        description: 'Spectacular picture quality with deep blacks.',
        variants: [],
        specifications: [{ name: 'Display', value: 'OLED 4K' }],
        images: [],
        rating: 4.9,
        reviewCount: 18,
        isActive: true,
      } as any);

      const res = await request(app).get('/api/v1/products/4k-oled-smart-tv');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.name).toBe('4K OLED Smart TV');

      spy.mockRestore();
    });

    it('returns 404 when product slug does not exist', async () => {
      const spy = vi.spyOn(productService, 'getProductBySlug').mockRejectedValueOnce(
        new AppError('Product not found or currently unavailable.', 404, 'PRODUCT_NOT_FOUND')
      );

      const res = await request(app).get('/api/v1/products/non-existent-product-slug-xyz');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PRODUCT_NOT_FOUND');

      spy.mockRestore();
    });
  });

  describe('Categories & Brands APIs', () => {
    it('GET /api/v1/categories returns list of active categories', async () => {
      const spy = vi.spyOn(categoryService, 'getCategories').mockResolvedValueOnce([
        { _id: 'c1' as any, name: 'Electronics', slug: 'electronics', isActive: true } as any,
      ]);

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBe(1);

      spy.mockRestore();
    });

    it('GET /api/v1/brands returns list of active brands', async () => {
      const spy = vi.spyOn(brandService, 'getBrands').mockResolvedValueOnce([
        { _id: 'b1' as any, name: 'Sony', slug: 'sony', isActive: true } as any,
      ]);

      const res = await request(app).get('/api/v1/brands');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.brands.length).toBe(1);

      spy.mockRestore();
    });
  });

  describe('Security & Admin Write Authorization', () => {
    it('rejects product creation without authentication (401)', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({
          name: 'Unauthorized Product',
          price: 99,
          SKU: 'UNAUTH-01',
          description: 'Should fail',
          category: 'cat-id',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects product creation when user role is not ADMIN (403)', async () => {
      const regularUser = new User({
        _id: 'user-regular-id' as any,
        name: 'Regular Customer',
        email: 'customer@example.com',
        role: 'USER',
        isActive: true,
      });

      const token = generateToken(regularUser);

      // Mock User.findById for auth middleware
      const findSpy = vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(regularUser),
      } as any);

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Regular User Product',
          price: 99,
          SKU: 'REG-01',
          description: 'Forbidden test',
          category: 'cat-id',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');

      findSpy.mockRestore();
    });
  });
});
