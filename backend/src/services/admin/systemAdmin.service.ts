import { Types } from 'mongoose';
import { AuditLog } from '../../models/auditLog.model.js';
import { env } from '../../config/env.js';
import { LOW_STOCK_THRESHOLD } from './inventoryAdmin.service.js';

export class SystemAdminService {
  // --- Audit Logs ---
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    adminId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 25));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.action) {
      filter.action = params.action.toUpperCase();
    }

    if (params.resource) {
      filter.resource = params.resource;
    }

    if (params.adminId && Types.ObjectId.isValid(params.adminId)) {
      filter.admin = new Types.ObjectId(params.adminId);
    }

    if (params.startDate || params.endDate) {
      filter.timestamp = {};
      if (params.startDate) filter.timestamp.$gte = new Date(params.startDate);
      if (params.endDate) filter.timestamp.$lte = new Date(params.endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('admin', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // --- Safe Settings (Strictly no secrets exposed) ---
  getSettings() {
    return {
      store: {
        name: 'Apex AI E-Commerce Platform',
        environment: env.NODE_ENV,
        currency: env.PAYMENT_CURRENCY || 'INR',
      },
      inventory: {
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        preventNegativeStock: true,
      },
      orders: {
        returnWindowDays: env.RETURN_WINDOW_DAYS || 14,
        allowCancellationsBeforeDelivery: true,
      },
      integrations: {
        paymentGatewayConfigured: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
        paymentGatewayProvider: 'Razorpay',
        emailDeliveryConfigured: Boolean(env.SMTP_HOST && env.SMTP_USER),
        corsOrigins: env.CORS_ORIGIN,
      },
    };
  }
}

export const systemAdminService = new SystemAdminService();
