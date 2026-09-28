import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { cartService } from '../src/services/cart.service.js';
import { wishlistService } from '../src/services/wishlist.service.js';
import { checkoutService } from '../src/services/checkout.service.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';

describe('Phase 5: Cart, Wishlist & Checkout API Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: mockUserId,
    name: 'Test Customer',
    email: 'testuser@example.com',
    role: 'USER',
    isActive: true,
  };

  const mockToken = generateToken(mockUser as any);
  const authHeader = 'Bearer ' + mockToken;

  let findByIdSpy: any;

  beforeEach(() => {
    findByIdSpy = vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    } as any);
  });

  afterEach(() => {
    findByIdSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Cart Authentication & Route Protection', () => {
    it('rejects GET /api/v1/cart without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/cart');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects POST /api/v1/cart/items without authentication (401)', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .send({ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 });
      expect(res.status).toBe(401);
    });

    it('rejects adding invalid product ID format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', authHeader)
        .send({ productId: 'invalid-id-xyz', quantity: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid quantity <= 0 or > 50 (400)', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const res1 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', authHeader)
        .send({ productId: validId, quantity: 0 });
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', authHeader)
        .send({ productId: validId, quantity: 51 });
      expect(res2.status).toBe(400);
    });
  });

  describe('Cart Operations with Service Mocking', () => {
    it('GET /api/v1/cart returns user cart with calculated totals', async () => {
      const mockResult = {
        cartId: 'cart-123',
        items: [
          {
            _id: 'item-1',
            productId: 'prod-1',
            name: 'Mechanical Keyboard',
            slug: 'mechanical-keyboard',
            image: 'https://example.com/keyboard.jpg',
            quantity: 2,
            currentPrice: 99.99,
            priceAtAddition: 99.99,
            priceChanged: false,
            lineTotal: 199.98,
            stockAvailable: 10,
            isAvailable: true,
          },
        ],
        itemCount: 2,
        subtotal: 199.98,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      };

      vi.spyOn(cartService, 'getCart').mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(199.98);
      expect(res.body.data.itemCount).toBe(2);
    });

    it('POST /api/v1/cart/items adds an item and returns 201', async () => {
      const validProdId = new mongoose.Types.ObjectId().toString();
      const mockResult = {
        cartId: 'cart-123',
        items: [],
        itemCount: 1,
        subtotal: 50.0,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      };

      vi.spyOn(cartService, 'addItem').mockResolvedValueOnce(mockResult);

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', authHeader)
        .send({ productId: validProdId, quantity: 1 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/v1/cart clears cart and returns 200', async () => {
      vi.spyOn(cartService, 'clearCart').mockResolvedValueOnce({
        cartId: 'cart-123',
        items: [],
        itemCount: 0,
        subtotal: 0,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      });

      const res = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe('Wishlist API Tests', () => {
    it('rejects unauthenticated wishlist access (401)', async () => {
      const res = await request(app).get('/api/v1/wishlist');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/wishlist returns items array when authenticated', async () => {
      vi.spyOn(wishlistService, 'getWishlist').mockResolvedValueOnce({
        wishlistId: 'wish-1',
        items: [],
        itemCount: 0,
      });

      const res = await request(app)
        .get('/api/v1/wishlist')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe('Checkout Summary API Tests', () => {
    it('rejects unauthenticated checkout summary request (401)', async () => {
      const res = await request(app).get('/api/v1/checkout/summary');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/checkout/summary returns breakdown and readiness evaluation', async () => {
      const mockSummary = {
        items: [],
        itemCount: 2,
        subtotal: 120.0,
        shippingFee: 0,
        tax: 0,
        total: 120.0,
        isReady: true,
        issues: [],
      };

      vi.spyOn(checkoutService, 'getCheckoutSummary').mockResolvedValueOnce(mockSummary as any);

      const res = await request(app)
        .get('/api/v1/checkout/summary')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(120.0);
      expect(res.body.data.isReady).toBe(true);
    });
  });
});
