import { Types } from 'mongoose';
import { Order, OrderStatus } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/errors.js';
import { logAdminAction } from '../../utils/auditLogger.js';
import { NotificationService } from '../notification.service.js';
import { emailService } from '../email.service.js';
import { logger } from '../../utils/logger.js';

// Valid forward progression order state transitions
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'SHIPPED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  CANCELLED: [],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

export class OrderAdminService {
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.paymentStatus) {
      filter.paymentStatus = params.paymentStatus;
    }

    if (params.search) {
      const sanitized = params.search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.$or = [
        { orderNumber: { $regex: sanitized, $options: 'i' } },
        { 'shippingAddress.name': { $regex: sanitized, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (params.startDate || params.endDate) {
      filter.createdAt = {};
      if (params.startDate) filter.createdAt.$gte = new Date(params.startDate);
      if (params.endDate) filter.createdAt.$lte = new Date(params.endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid order ID', 400, 'INVALID_ID');
    }

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .lean();

    if (!order) {
      throw new AppError('Order not found', 404, 'NOT_FOUND');
    }

    return order;
  }

  async updateOrderStatus(params: {
    orderId: string;
    status: OrderStatus;
    comment?: string;
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
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

    const currentStatus = order.status;
    const targetStatus = params.status;

    // Validate lifecycle progression
    if (currentStatus !== targetStatus) {
      const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(targetStatus)) {
        throw new AppError(
          `Invalid state transition: Cannot move order from ${currentStatus} to ${targetStatus}`,
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }

    const previousState = {
      status: order.status,
      tracking: order.tracking,
    };

    order.status = targetStatus;

    // Update tracking info if provided
    if (params.carrier || params.trackingNumber || params.trackingUrl) {
      order.tracking = {
        carrier: params.carrier || order.tracking?.carrier,
        trackingNumber: params.trackingNumber || order.tracking?.trackingNumber,
        trackingUrl: params.trackingUrl || order.tracking?.trackingUrl,
      };
    }

    // Append to status history
    order.statusHistory.push({
      status: targetStatus,
      timestamp: new Date(),
      comment: params.comment || `Status updated to ${targetStatus} by admin`,
    });

    await order.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'UPDATE_ORDER_STATUS',
      resource: 'Order',
      resourceId: order._id.toString(),
      previousState,
      newState: { status: order.status, tracking: order.tracking },
      reason: params.comment || `Updated status to ${targetStatus}`,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    // Send notifications to user based on status change
    try {
      const notifTypeMap: Record<string, string> = {
        PROCESSING: 'ORDER_PROCESSING',
        PACKED: 'ORDER_PACKED',
        SHIPPED: 'ORDER_SHIPPED',
        OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
        DELIVERED: 'ORDER_DELIVERED',
        CANCELLED: 'ORDER_CANCELLED',
      };

      const notifType = notifTypeMap[targetStatus] || 'ORDER_UPDATE';

      await NotificationService.createNotification({
        userId: order.user.toString(),
        type: notifType as any,
        title: `Order Status: ${targetStatus}`,
        message: `Your order #${order.orderNumber} is now ${targetStatus.toLowerCase().replace(/_/g, ' ')}. ${order.tracking?.trackingNumber ? `Tracking: ${order.tracking.trackingNumber}` : ''}`,
        actionUrl: `/orders/${order.orderNumber}`,
        priority: targetStatus === 'DELIVERED' || targetStatus === 'SHIPPED' ? 'HIGH' : 'MEDIUM',
        channel: 'ALL',
        idempotencyKey: `ORDER_STATUS_${order.orderNumber}_${targetStatus}`,
      });

      if (targetStatus === 'SHIPPED') {
        const user = await User.findById(order.user).select('email');
        if (user?.email) {
          await emailService.sendShippingUpdateEmail(
            user.email,
            {
              orderNumber: order.orderNumber,
              carrier: order.tracking?.carrier,
              trackingNumber: order.tracking?.trackingNumber,
              trackingUrl: order.tracking?.trackingUrl,
              estimatedDeliveryDate: order.tracking?.estimatedDelivery,
            },
            order.user.toString()
          );
        }
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch order status notification/email: ${notifErr.message}`);
    }

    return order;
  }

  async adminCancelOrder(params: {
    orderId: string;
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

    if (['DELIVERED', 'RETURNED', 'REFUNDED', 'CANCELLED'].includes(order.status)) {
      throw new AppError(
        `Cannot cancel order with status "${order.status}"`,
        400,
        'ORDER_NOT_CANCELLABLE'
      );
    }

    // Restore inventory if deducted
    if (order.inventoryDeducted) {
      for (const item of order.items) {
        if (item.variantSku) {
          await Product.updateOne(
            { _id: item.product, 'variants.sku': item.variantSku },
            {
              $inc: {
                stock: item.quantity,
                'variants.$.stock': item.quantity,
              },
            }
          );
        } else {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } }
          );
        }
      }
      order.inventoryDeducted = false;
    }

    const previousState = { status: order.status, paymentStatus: order.paymentStatus };

    order.status = 'CANCELLED';
    order.cancellation = {
      cancelledAt: new Date(),
      reason: params.reason,
      cancelledBy: new Types.ObjectId(params.adminId),
    };

    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
      order.refund = {
        amount: order.totalAmount,
        status: 'PENDING',
      };
    } else {
      order.paymentStatus = 'CANCELLED';
    }

    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      comment: `Admin cancellation: ${params.reason}`,
    });

    await order.save();

    await logAdminAction({
      adminId: params.adminId,
      action: 'ADMIN_CANCEL_ORDER',
      resource: 'Order',
      resourceId: order._id.toString(),
      previousState,
      newState: { status: order.status, paymentStatus: order.paymentStatus },
      reason: params.reason,
      ipAddress: params.ip,
      userAgent: params.ua,
    });

    return order;
  }
}

export const orderAdminService = new OrderAdminService();
