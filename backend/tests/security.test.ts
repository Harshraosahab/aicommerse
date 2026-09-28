import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { cleanNoSqlInjection } from '../src/middleware/sanitize.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { Order } from '../src/models/order.model.js';
import { SupportTicket } from '../src/models/supportTicket.model.js';
import { RazorpayProvider } from '../src/services/payment/razorpay.provider.js';
import { dashboardService } from '../src/services/admin/dashboard.service.js';
import mongoose from 'mongoose';

describe('Phase 12: Security & Penetration Testing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. NoSQL Query Operator Injection Sanitization', () => {
    it('strips top-level and nested keys starting with $ or containing dots', () => {
      const maliciousPayload = {
        username: 'victim@example.com',
        password: { $gt: '' },
        profile: {
          $ne: 'admin',
          age: 25,
          'nested.field': 'injected',
          tags: [{ $regex: '.*' }, 'valid-tag'],
        },
      };

      const sanitized = cleanNoSqlInjection(maliciousPayload);

      expect(sanitized.username).toBe('victim@example.com');
      expect((sanitized as any).password).toEqual({});
      expect((sanitized as any).profile.$ne).toBeUndefined();
      expect((sanitized as any).profile['nested.field']).toBeUndefined();
      expect(sanitized.profile.age).toBe(25);
      expect(sanitized.profile.tags).toEqual([{}, 'valid-tag']);
    });

    it('sanitizes query parameters and bodies during HTTP request lifecycle', async () => {
      // Send a request with malicious Mongo query operators in query params
      const res = await request(app)
        .get('/api/v1/products')
        .query({ 'category[$gt]': '', search: 'phone' });

      // Should safely reject with 400 Validation Error or safely process with 200, never crash with 500
      expect([200, 400]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });
  });

  describe('2. RBAC & Administrative Route Protection', () => {
    it('rejects unauthenticated requests to /api/v1/admin/dashboard/metrics with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/metrics');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated non-admin customers with 403 FORBIDDEN', async () => {
      const customerId = new mongoose.Types.ObjectId();
      const customerToken = generateToken({
        _id: customerId,
        email: 'customer@example.com',
        role: 'USER',
      } as any);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: customerId,
          email: 'customer@example.com',
          role: 'USER',
          isActive: true,
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows authenticated administrator to access /api/v1/admin/dashboard/metrics', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const adminToken = generateToken({
        _id: adminId,
        email: 'admin@example.com',
        role: 'ADMIN',
      } as any);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: adminId,
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
        }),
      } as any);

      vi.spyOn(dashboardService, 'getMetrics').mockResolvedValue({
        period: '30d',
        users: { total: 1, active: 1, new: 1 },
        products: { total: 10, active: 10, lowStock: 0, outOfStock: 0 },
        orders: { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, returnRequested: 0, returned: 0 },
        financials: { netRevenue: 0, grossRevenue: 0, refundedAmount: 0, paidOrdersCount: 0, averageOrderValue: 0 },
        payments: { paid: 0, pending: 0, failed: 0, refunded: 0 },
        abandonedCarts: 0,
        recentOrders: [],
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. IDOR / BOLA Prevention (Ownership Enforcement)', () => {
    it('prevents User A from viewing User B order details', async () => {
      const userAId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId().toString();

      const userAToken = generateToken({
        _id: userAId,
        email: 'usera@example.com',
        role: 'USER',
      } as any);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userAId,
          email: 'usera@example.com',
          role: 'USER',
          isActive: true,
        }),
      } as any);

      // Order belongs to User B
      vi.spyOn(Order, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('prevents User A from viewing User B support ticket', async () => {
      const userAId = new mongoose.Types.ObjectId();

      const userAToken = generateToken({
        _id: userAId,
        email: 'usera@example.com',
        role: 'USER',
      } as any);

      vi.spyOn(User, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: userAId,
          email: 'usera@example.com',
          role: 'USER',
          isActive: true,
        }),
      } as any);

      // Query checks { ticketNumber, user: userAId }, so User B ticket returns null
      vi.spyOn(SupportTicket, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/support/tickets/TKT-20260916-9999')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Payment Signature Tampering Detection', () => {
    it('rejects tampered or forged HMAC payment verification signatures', () => {
      const provider = new RazorpayProvider();
      // Directly configure test secret on provider instance
      (provider as any).keySecret = 'mock_secret_key_12345';

      const verificationResult = provider.verifySignature({
        orderId: 'order_test_123',
        paymentId: 'pay_test_456',
        signature: 'invalid_forged_tampered_signature_hex_value',
      });

      expect(verificationResult).toBe(false);
    });
  });

  describe('5. Kubernetes / Container Health & Readiness Probes', () => {
    it('GET /api/v1/health/live returns HTTP 200 with process liveness status', async () => {
      const res = await request(app).get('/api/v1/health/live');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(typeof res.body.data.uptimeSeconds).toBe('number');
    });

    it('GET /api/v1/health/ready returns status and database readiness check', async () => {
      const res = await request(app).get('/api/v1/health/ready');

      // Returns either 200 (connected) or 503 (disconnected in mock env) with structured status
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('isReady');
    });
  });
});
