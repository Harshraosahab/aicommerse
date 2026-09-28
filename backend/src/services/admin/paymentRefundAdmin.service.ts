import { Types } from 'mongoose';
import { Order } from '../../models/order.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';

export class PaymentRefundAdminService {
  async getPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.status) {
      filter.paymentStatus = params.status;
    }

    if (params.method) {
      filter['paymentInfo.method'] = params.method;
    }

    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) filter.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) filter.createdAt.$lte = new Date(params.endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .select('orderNumber totalAmount paymentStatus paymentInfo createdAt shippingAddress.name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const payments = orders.map((o: any) => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      customerName: o.shippingAddress?.name || o.user?.name,
      customerEmail: o.user?.email,
      amount: o.totalAmount,
      method: o.paymentInfo?.method || 'UNKNOWN',
      status: o.paymentStatus,
      transactionId: o.paymentInfo?.transactionId || null,
      paidAt: o.paymentInfo?.paidAt || null,
      createdAt: o.createdAt,
    }));

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReturns(params: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      $or: [
        { status: 'RETURN_REQUESTED' },
        { 'returnRequest.status': { $exists: true } },
      ],
    };

    if (params.status) {
      filter['returnRequest.status'] = params.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ 'returnRequest.requestedAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      returns: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async decideReturn(params: {
    orderId: string;
    decision: 'APPROVED' | 'REJECTED';
    reason: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.orderId)) {
      throw new AppError('Invalid order ID', 400, 'INVALID_ID');
    }

    const order = await Order.findById(params.orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (!order.returnRequest) {
      throw new AppError('No return request found on this order', 400, 'NO_RETURN_REQUEST');
    }

    const previousState = { returnRequest: order.returnRequest, status: order.status };

    order.returnRequest.status = params.decision;
    if (params.decision === 'APPROVED') {
      order.status = 'RETURNED';
    }

    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      comment: `Return request ${params.decision}: ${params.reason}`,
    });

    await order.save();

    await logAdminAction({
      adminId: params.adminId,
      action: params.decision === 'APPROVED' ? 'APPROVE_RETURN' : 'REJECT_RETURN',
      resource: 'Order',
      resourceId: order._id.toString(),
      previousState,
      newState: { returnRequest: order.returnRequest, status: order.status },
      reason: params.reason,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return order;
  }

  async getRefunds(params: { page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { 'refund.amount': { $gt: 0 } },
        { paymentStatus: { $in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
      ],
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      refunds: orders.map((o: any) => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        refund: o.refund,
        paymentStatus: o.paymentStatus,
        customer: o.user,
        updatedAt: o.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async processRefund(params: {
    orderId: string;
    amount: number;
    reason: string;
    adminId: string;
    ip?: string;
    ua?: string;
  }) {
    if (!Types.ObjectId.isValid(params.orderId)) {
      throw new AppError('Invalid order ID', 400, 'INVALID_ID');
    }

    const order = await Order.findById(params.orderId);
    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIALLY_REFUNDED') {
      throw new AppError(
        `Cannot refund order with payment status "${order.paymentStatus}"`,
        400,
        'ORDER_NOT_REFUNDABLE'
      );
    }

    const currentRefunded = order.refund?.amount || 0;
    const maxRefundable = Math.round((order.totalAmount - currentRefunded) * 100) / 100;

    if (params.amount > maxRefundable) {
      throw new AppError(
        `Requested refund of ${params.amount} exceeds maximum refundable amount of ${maxRefundable}`,
        400,
        'INVALID_REFUND_AMOUNT'
      );
    }

    const newRefundTotal = Math.round((currentRefunded + params.amount) * 100) / 100;
    const previousState = {
      refund: order.refund,
      paymentStatus: order.paymentStatus,
    };

    order.refund = {
      amount: newRefundTotal,
      status: 'PROCESSED',
      processedAt: new Date(),
    };

    if (newRefundTotal >= order.totalAmount) {
      order.paymentStatus = 'REFUNDED';
      if (order.status === 'RETURNED') {
        order.status = 'REFUNDED';
      }
    } else {
      order.paymentStatus = 'PARTIALLY_REFUNDED';
    }

    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      comment: `Refund of ${params.amount} processed: ${params.reason}`,
    });

    await order.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'PROCESS_REFUND',
      resource: 'Order',
      resourceId: order._id.toString(),
      previousState,
      newState: { refund: order.refund, paymentStatus: order.paymentStatus },
      reason: params.reason,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return order;
  }
}

export const paymentRefundAdminService = new PaymentRefundAdminService();
