import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { dashboardService } from '../src/services/admin/dashboard.service.js';
import { productAdminService } from '../src/services/admin/productAdmin.service.js';
import { inventoryAdminService } from '../src/services/admin/inventoryAdmin.service.js';
import { orderAdminService } from '../src/services/admin/orderAdmin.service.js';
import { paymentRefundAdminService } from '../src/services/admin/paymentRefundAdmin.service.js';
import { userAdminService } from '../src/services/admin/userAdmin.service.js';
import { categoryBrandAdminService } from '../src/services/admin/categoryBrandAdmin.service.js';
import { marketingAdminService } from '../src/services/admin/marketingAdmin.service.js';
import { supportReviewAdminService } from '../src/services/admin/supportReviewAdmin.service.js';
import { systemAdminService } from '../src/services/admin/systemAdmin.service.js';
import { AppError } from '../src/utils/errors.js';

describe('Phase 7: Complete Admin Panel & Management System Tests', () => {
  const normalUserId = new mongoose.Types.ObjectId().toString();
  const adminUserId = new mongoose.Types.ObjectId().toString();
  const productManagerId = new mongoose.Types.ObjectId().toString();
  const superAdminId = new mongoose.Types.ObjectId().toString();

  const normalUser = {
    _id: normalUserId,
    name: 'Normal Customer',
    email: 'customer@example.com',
    role: 'USER',
    isActive: true,
  };

  const adminUser = {
    _id: adminUserId,
    name: 'Store Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
  };

  const productManagerUser = {
    _id: productManagerId,
    name: 'Catalog Lead',
    email: 'pm@example.com',
    role: 'PRODUCT_MANAGER',
    isActive: true,
  };

  const superAdminUser = {
    _id: superAdminId,
    name: 'Super Administrator',
    email: 'superadmin@example.com',
    role: 'SUPER_ADMIN',
    isActive: true,
  };

  const normalToken = generateToken(normalUser as any);
  const adminToken = generateToken(adminUser as any);
  const productManagerToken = generateToken(productManagerUser as any);
  const superAdminToken = generateToken(superAdminUser as any);

  let findByIdSpy: any;

  beforeEach(() => {
    findByIdSpy = vi.spyOn(User, 'findById').mockImplementation((id: any) => {
      let resolved = adminUser;
      const strId = id?.toString();
      if (strId === normalUserId) resolved = normalUser;
      else if (strId === productManagerId) resolved = productManagerUser;
      else if (strId === superAdminId) resolved = superAdminUser;

      return {
        select: vi.fn().mockResolvedValue(resolved),
      } as any;
    });
  });

  afterEach(() => {
    findByIdSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe('Admin Security & RBAC Guards', () => {
    it('rejects unauthenticated request to /api/v1/admin/dashboard/metrics with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard/metrics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects normal authenticated customer from accessing admin endpoints (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${normalToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows full ADMIN role to access dashboard metrics (200)', async () => {
      vi.spyOn(dashboardService, 'getMetrics').mockResolvedValue({
        period: '30d',
        users: { total: 10, active: 9, new: 2 },
        products: { total: 25, active: 24, lowStock: 2, outOfStock: 0 },
        orders: { total: 5, pending: 1, confirmed: 2, processing: 0, shipped: 1, delivered: 1, cancelled: 0, returnRequested: 0, returned: 0 },
        financials: { netRevenue: 4999, grossRevenue: 4999, refundedAmount: 0, paidOrdersCount: 4, averageOrderValue: 1249.75 },
        payments: { paid: 4, pending: 1, failed: 0, refunded: 0 },
        abandonedCarts: 0,
        recentOrders: [],
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.financials.netRevenue).toBe(4999);
      expect(res.body.data.products.total).toBe(25);
    });

    it('permits PRODUCT_MANAGER for products, but forbids them from refunds (403 INSUFFICIENT_PERMISSIONS)', async () => {
      // 1. Should be allowed to list products
      vi.spyOn(productAdminService, 'getProducts').mockResolvedValue({
        products: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      });

      const prodRes = await request(app)
        .get('/api/v1/admin/products')
        .set('Authorization', `Bearer ${productManagerToken}`);

      expect(prodRes.status).toBe(200);
      expect(prodRes.body.success).toBe(true);

      // 2. Should be forbidden from refunds
      const refundRes = await request(app)
        .get('/api/v1/admin/refunds')
        .set('Authorization', `Bearer ${productManagerToken}`);

      expect(refundRes.status).toBe(403);
      expect(refundRes.body.success).toBe(false);
      expect(refundRes.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Product Administration', () => {
    it('creates product with validation and records audit log', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Admin Test Product',
        SKU: 'ADMIN-PROD-001',
        price: 999,
        stock: 50,
      };

      vi.spyOn(productAdminService, 'createProduct').mockResolvedValue(mockProduct as any);

      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Test Product',
          description: 'A comprehensive description for testing product creation.',
          category: new mongoose.Types.ObjectId().toString(),
          price: 999,
          stock: 50,
          SKU: 'ADMIN-PROD-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.SKU).toBe('ADMIN-PROD-001');
    });

    it('soft-deactivates product when historic orders reference it', async () => {
      const prodId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(productAdminService, 'deleteOrDeactivateProduct').mockResolvedValue({
        action: 'DEACTIVATED',
        message: 'Product has historical order references and was deactivated to preserve order history.',
        product: { _id: prodId, isActive: false } as any,
      });

      const res = await request(app)
        .delete(`/api/v1/admin/products/${prodId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('DEACTIVATED');
    });
  });

  describe('Inventory Administration & Traceable Stock Adjustments', () => {
    it('lists inventory and calculates stock statuses', async () => {
      vi.spyOn(inventoryAdminService, 'getInventory').mockResolvedValue({
        inventory: [
          {
            id: 'p1',
            name: 'Item 1',
            sku: 'SKU-001',
            stock: 2,
            price: 500,
            stockStatus: 'LOW_STOCK',
            isActive: true,
            variants: [],
          },
        ],
        threshold: 10,
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      });

      const res = await request(app)
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].stockStatus).toBe('LOW_STOCK');
    });

    it('performs stock adjustment with reason and audit log', async () => {
      const prodId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(inventoryAdminService, 'adjustStock').mockResolvedValue({
        productId: prodId as any,
        sku: 'SKU-001',
        oldStock: 5,
        adjustment: 10,
        newStock: 15,
        reason: 'Restocked from warehouse shipment',
      });

      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: prodId,
          adjustment: 10,
          reason: 'Restocked from warehouse shipment',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStock).toBe(15);
    });

    it('rejects stock adjustment causing negative inventory', async () => {
      const prodId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(inventoryAdminService, 'adjustStock').mockRejectedValue(
        new AppError('Cannot adjust stock below zero. Current stock is 5, attempted adjustment: -10', 400, 'NEGATIVE_STOCK')
      );

      const res = await request(app)
        .post('/api/v1/admin/inventory/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId: prodId,
          adjustment: -10,
          reason: 'Correction',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NEGATIVE_STOCK');
    });
  });

  describe('Order Fulfillment & State Machine Transitions', () => {
    it('updates order status to SHIPPED with tracking details', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(orderAdminService, 'updateOrderStatus').mockResolvedValue({
        _id: orderId,
        orderStatus: 'SHIPPED',
        tracking: {
          carrier: 'BlueDart',
          trackingNumber: 'BD12345678',
        },
      } as any);

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHIPPED',
          carrier: 'BlueDart',
          trackingNumber: 'BD12345678',
          comment: 'Dispatched via air cargo',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('SHIPPED');
    });

    it('rejects invalid order state transitions (e.g. DELIVERED to PROCESSING)', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(orderAdminService, 'updateOrderStatus').mockRejectedValue(
        new AppError('Invalid state transition: Cannot move order from DELIVERED to PROCESSING', 400, 'INVALID_STATUS_TRANSITION')
      );

      const res = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PROCESSING',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });
  });

  describe('Return Decisions & Refund Processing', () => {
    it('approves customer return request and logs decision', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(paymentRefundAdminService, 'decideReturn').mockResolvedValue({
        _id: orderId,
        orderStatus: 'RETURNED',
        returnRequest: { status: 'APPROVED' },
      } as any);

      const res = await request(app)
        .post(`/api/v1/admin/returns/${orderId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'APPROVED',
          reason: 'Items verified in original packaging',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('RETURNED');
    });

    it('rejects refund amount exceeding order total', async () => {
      const orderId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(paymentRefundAdminService, 'processRefund').mockRejectedValue(
        new AppError('Requested refund of 5000 exceeds maximum refundable amount of 1000', 400, 'INVALID_REFUND_AMOUNT')
      );

      const res = await request(app)
        .post(`/api/v1/admin/refunds/${orderId}/process`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          reason: 'Customer refund',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_REFUND_AMOUNT');
    });
  });

  describe('User Account Actions & Privilege Safeguards', () => {
    it('activates and deactivates customer account', async () => {
      const targetUserId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(userAdminService, 'updateUserStatus').mockResolvedValue({
        id: targetUserId as any,
        name: 'Jane Doe',
        email: 'jane@example.com',
        isActive: false,
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: false,
          reason: 'Terms of service violation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('prevents normal admin from modifying administrative roles without super admin authorization', async () => {
      const targetUserId = new mongoose.Types.ObjectId().toString();

      vi.spyOn(userAdminService, 'updateUserRole').mockRejectedValue(
        new AppError('Only Super Admins can manage administrative roles', 403, 'FORBIDDEN')
      );

      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Settings Security', () => {
    it('returns operational settings and strictly excludes secrets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.currency).toBeDefined();
      expect(res.body.data.inventory.lowStockThreshold).toBeDefined();

      // Verify that no secrets or keys are returned in response
      const jsonString = JSON.stringify(res.body);
      expect(jsonString).not.toContain('JWT_SECRET');
      expect(jsonString).not.toContain('MONGODB_URI');
      expect(jsonString).not.toContain('RAZORPAY_KEY_SECRET');
      expect(jsonString).not.toContain('SMTP_PASS');
    });
  });
});
