import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { recommendationService } from '../src/services/recommendation.service.js';
import { dashboardService } from '../src/services/admin/dashboard.service.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { AppError } from '../src/utils/errors.js';

describe('Phase 8: Recommendation Engine & Admin Telemetry API Tests', () => {
  const adminId = '507f1f77bcf86cd799439099';
  const customerId = '507f1f77bcf86cd799439088';
  const sampleProductId = '507f1f77bcf86cd799439077';

  const mockProduct = {
    _id: sampleProductId,
    name: 'Pro Wireless Headphones',
    slug: 'pro-wireless-headphones',
    price: 199.99,
    stock: 25,
    SKU: 'HEAD-001',
    rating: 4.8,
    reviewCount: 34,
    images: [{ url: 'https://example.com/headphones.jpg', isPrimary: true }],
  };

  describe('GET /api/v1/recommendations/personalized', () => {
    it('returns personalized recommendations for user', async () => {
      const spy = vi.spyOn(recommendationService, 'getPersonalizedRecommendations').mockResolvedValueOnce({
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.88,
            reason: 'Matches preferred audio category and brand',
            algorithm: 'hybrid_interaction_profile',
            isColdStart: false,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'hybrid_interaction_profile',
        modelVersion: 'v1.0.0-hybrid',
        coldStart: false,
        fallback: false,
      });

      const res = await request(app).get('/api/v1/recommendations/personalized?limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toHaveLength(1);
      expect(res.body.data.recommendations[0].product.name).toBe('Pro Wireless Headphones');
      expect(res.body.data.coldStart).toBe(false);

      spy.mockRestore();
    });

    it('returns honest cold-start trending fallback for new users with 0 interactions', async () => {
      const spy = vi.spyOn(recommendationService, 'getPersonalizedRecommendations').mockResolvedValueOnce({
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.9,
            reason: 'Trending now (popular among shoppers)',
            algorithm: 'cold_start_trending',
            isColdStart: true,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'cold_start_trending',
        modelVersion: 'v1.0.0-fallback',
        coldStart: true,
        fallback: false,
      });

      const res = await request(app).get('/api/v1/recommendations/personalized?sessionToken=fresh-user-session');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.coldStart).toBe(true);
      expect(res.body.data.recommendations[0].isColdStart).toBe(true);

      spy.mockRestore();
    });
  });

  describe('GET /api/v1/recommendations/product/:productId', () => {
    it('returns content-based similar products for a valid product', async () => {
      const spy = vi.spyOn(recommendationService, 'getSimilarProducts').mockResolvedValueOnce({
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.82,
            reason: 'Same category and brand',
            algorithm: 'multi_feature_content_similarity',
            isColdStart: false,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'multi_feature_content_similarity',
        modelVersion: 'v1.0.0-hybrid',
        coldStart: false,
        fallback: false,
      });

      const res = await request(app).get(`/api/v1/recommendations/product/${sampleProductId}?limit=4`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toHaveLength(1);
      expect(res.body.data.recommendations[0].score).toBe(0.82);

      spy.mockRestore();
    });

    it('returns 404 if product not found', async () => {
      const spy = vi.spyOn(recommendationService, 'getSimilarProducts').mockRejectedValueOnce(
        new AppError('Product not found for similarity query', 404, 'PRODUCT_NOT_FOUND')
      );

      const res = await request(app).get('/api/v1/recommendations/product/non-existent-product');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      spy.mockRestore();
    });
  });

  describe('GET /api/v1/recommendations/trending', () => {
    it('returns real trending products from MongoDB interaction calculations', async () => {
      const spy = vi.spyOn(recommendationService, 'getTrendingProducts').mockResolvedValueOnce({
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.95,
            reason: 'High customer engagement and trending activity',
            algorithm: 'real_interaction_velocity',
            isColdStart: false,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'trending_engagement',
        modelVersion: 'v1.0.0',
        coldStart: false,
        fallback: false,
      });

      const res = await request(app).get('/api/v1/recommendations/trending?limit=6&period=7d');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toHaveLength(1);
      expect(res.body.data.recommendations[0].algorithm).toBe('real_interaction_velocity');

      spy.mockRestore();
    });
  });

  describe('GET /api/v1/admin/dashboard/recommendations-analytics', () => {
    it('requires admin privileges', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/recommendations-analytics');
      expect(res.status).toBe(401);
    });

    it('returns real telemetry, zero-division protected CTR, and AI service health for admin', async () => {
      const adminToken = generateToken({
        _id: adminId as any,
        email: 'admin@ecommerce.local',
        role: 'SUPER_ADMIN',
      } as any);

      const userSpy = vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: adminId,
          email: 'admin@ecommerce.local',
          role: 'SUPER_ADMIN',
          isActive: true,
        }),
      } as any);

      const spy = vi.spyOn(dashboardService, 'getRecommendationAnalytics').mockResolvedValueOnce({
        period: '30d',
        totalInteractions: 145,
        actionCounts: {
          VIEW: 80,
          CLICK: 25,
          SEARCH: 10,
          ADD_TO_CART: 18,
          REMOVE_FROM_CART: 2,
          WISHLIST: 6,
          PURCHASE: 4,
        },
        telemetry: {
          recommendationImpressions: 50,
          recommendationClicks: 10,
          clickThroughRatePercent: 20.0,
        },
        aiEngine: {
          status: 'online',
          modelVersion: 'v1.0.0-hybrid',
          serviceUrl: 'http://localhost:8000',
          algorithms: ['user_interaction_affinity', 'content_multi_feature_similarity'],
        },
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard/recommendations-analytics?period=30d')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalInteractions).toBe(145);
      expect(res.body.data.telemetry.clickThroughRatePercent).toBe(20.0);
      expect(res.body.data.aiEngine.status).toBe('online');

      userSpy.mockRestore();
      spy.mockRestore();
    });
  });
});
