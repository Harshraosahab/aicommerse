import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { orderService } from '../src/services/order.service.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { AppError } from '../src/utils/errors.js';

describe('Phase 6: Orders, Payments & Returns API Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockAddressId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: mockUserId,
    name: 'Test Buyer',
    email: 'buyer@example.com',
    role: 'USER',
    isActive: true,
    addresses: [
      {
        _id: mockAddressId,
        street: '123 Tech Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN',
        isDefault: true,
      },
    ],
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

  describe('Order Authentication & Route Guards', () => {
    it('rejects POST /api/v1/orders without authentication (401)', async () => {
      const res = await request(app).post('/api/v1/orders').send({
        addressId: mockAddressId,
        paymentMethod: 'COD',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects GET /api/v1/orders without authentication (401)', async () => {
      const res = await request(app).get('/api/v1/orders');
      expect(res.status).toBe(401);
    });

    it('rejects POST /api/v1/payments/verify without authentication (401)', async () => {
      const res = await request(app).post('/api/v1/payments/verify').send({
        orderId: new mongoose.Types.ObjectId().toString(),
        paymentId: 'pay_123',
        signature: 'sig_123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Order Input Validation', () => {
    it('rejects invalid addressId format (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({
          addressId: 'not-a-valid-objectid',
          paymentMethod: 'COD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unsupported payment method (400)', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({
          addressId: mockAddressId,
          paymentMethod: 'BITCOIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Order Initiation & Processing', () => {
    it('successfully initiates COD order and returns confirmed status', async () => {
      const mockOrder = {
        _id: new mongoose.Types.ObjectId().toString(),
        orderNumber: 'ORD-20260909-A1B2C3',
        invoiceNumber: 'INV-20260909-A1B2C3',
        user: mockUserId,
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            name: 'Mechanical Keyboard',
            price: 2499,
            quantity: 1,
            lineTotal: 2499,
          },
        ],
        shippingAddress: mockUser.addresses[0],
        subtotal: 2499,
        shippingFee: 0,
        tax: 0,
        totalAmount: 2499,
        currency: 'INR',
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
        orderStatus: 'CONFIRMED',
        inventoryDeducted: true,
      };

      vi.spyOn(orderService, 'initiateOrder').mockResolvedValueOnce({
        order: mockOrder as any,
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({
          addressId: mockAddressId,
          paymentMethod: 'COD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderNumber).toBe('ORD-20260909-A1B2C3');
      expect(res.body.data.order.orderStatus).toBe('CONFIRMED');
      expect(res.body.data.order.paymentMethod).toBe('COD');
    });

    it('returns 503 CONFIGURATION_REQUIRED when online payment gateway is unconfigured', async () => {
      vi.spyOn(orderService, 'initiateOrder').mockRejectedValueOnce(
        new AppError('Payment gateway credentials not configured on backend', 503, 'CONFIGURATION_REQUIRED')
      );

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({
          addressId: mockAddressId,
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFIGURATION_REQUIRED');
    });
  });

  describe('Payment Verification', () => {
    it('verifies valid payment signature and marks order PAID', async () => {
      const mockOrderId = new mongoose.Types.ObjectId().toString();
      const mockPaidOrder = {
        _id: mockOrderId,
        orderNumber: 'ORD-20260909-PAID01',
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentTransactionId: 'pay_test_12345',
        paymentVerifiedAt: new Date(),
      };

      vi.spyOn(orderService, 'verifyPayment').mockResolvedValueOnce(mockPaidOrder as any);

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', authHeader)
        .send({
          orderId: mockOrderId,
          paymentId: 'pay_test_12345',
          signature: 'valid_crypto_hmac_signature',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.paymentStatus).toBe('PAID');
      expect(res.body.data.order.orderStatus).toBe('CONFIRMED');
    });

    it('rejects tampered or invalid payment signatures', async () => {
      vi.spyOn(orderService, 'verifyPayment').mockRejectedValueOnce(
        new AppError('Payment signature verification failed.', 400, 'PAYMENT_VERIFICATION_FAILED')
      );

      const res = await request(app)
        .post('/api/v1/payments/verify')
        .set('Authorization', authHeader)
        .send({
          orderId: new mongoose.Types.ObjectId().toString(),
          paymentId: 'pay_tampered_123',
          signature: 'invalid_forged_signature',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PAYMENT_VERIFICATION_FAILED');
    });
  });

  describe('Order History & Details (IDOR Protection)', () => {
    it('returns paginated orders for the authenticated user', async () => {
      vi.spyOn(orderService, 'getUserOrders').mockResolvedValueOnce({
        orders: [
          {
            _id: new mongoose.Types.ObjectId().toString(),
            orderNumber: 'ORD-001',
            totalAmount: 1999,
            orderStatus: 'CONFIRMED',
          } as any,
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const res = await request(app)
        .get('/api/v1/orders?page=1&limit=10')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('returns 404 when accessing an order belonging to another user (IDOR prevention)', async () => {
      const otherUserOrderId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(orderService, 'getOrderById').mockRejectedValueOnce(
        new AppError('Order not found or does not belong to you', 404, 'ORDER_NOT_FOUND')
      );

      const res = await request(app)
        .get(`/api/v1/orders/${otherUserOrderId}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
    });
  });

  describe('Order Cancellation & Return Lifecycle', () => {
    it('allows cancellation of eligible order and restores inventory', async () => {
      const mockOrderId = new mongoose.Types.ObjectId().toString();
      const mockCancelledOrder = {
        _id: mockOrderId,
        orderStatus: 'CANCELLED',
        cancellation: {
          reason: 'Ordered by mistake',
          cancelledAt: new Date(),
        },
      };

      vi.spyOn(orderService, 'cancelOrder').mockResolvedValueOnce(mockCancelledOrder as any);

      const res = await request(app)
        .post(`/api/v1/orders/${mockOrderId}/cancel`)
        .set('Authorization', authHeader)
        .send({ reason: 'Ordered by mistake' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderStatus).toBe('CANCELLED');
    });

    it('rejects cancellation when order is already dispatched or delivered', async () => {
      const mockOrderId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(orderService, 'cancelOrder').mockRejectedValueOnce(
        new AppError('Order has already been dispatched.', 400, 'CANNOT_CANCEL_ORDER')
      );

      const res = await request(app)
        .post(`/api/v1/orders/${mockOrderId}/cancel`)
        .set('Authorization', authHeader)
        .send({ reason: 'Too late to cancel' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CANNOT_CANCEL_ORDER');
    });

    it('rejects return requests for orders that are not DELIVERED', async () => {
      const mockOrderId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(orderService, 'requestReturn').mockRejectedValueOnce(
        new AppError('Returns are only permissible after delivery.', 400, 'NOT_ELIGIBLE_FOR_RETURN')
      );

      const res = await request(app)
        .post(`/api/v1/orders/${mockOrderId}/return`)
        .set('Authorization', authHeader)
        .send({
          reason: 'Defective item',
          items: [{ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_ELIGIBLE_FOR_RETURN');
    });
  });

  describe('Invoice Snapshot', () => {
    it('returns structured invoice data with real order details', async () => {
      const mockOrderId = new mongoose.Types.ObjectId().toString();
      const mockInvoice = {
        invoiceNumber: 'INV-20260909-XYZ',
        orderNumber: 'ORD-20260909-XYZ',
        invoiceDate: new Date(),
        currency: 'INR',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        financials: {
          subtotal: 2499,
          totalAmount: 2499,
        },
      };

      vi.spyOn(orderService, 'getOrderInvoice').mockResolvedValueOnce(mockInvoice);

      const res = await request(app)
        .get(`/api/v1/orders/${mockOrderId}/invoice`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoice.invoiceNumber).toBe('INV-20260909-XYZ');
      expect(res.body.data.invoice.financials.totalAmount).toBe(2499);
    });
  });
});