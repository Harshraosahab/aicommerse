import crypto from 'crypto';
import { Types } from 'mongoose';
import { Order, IOrder, OrderStatus, IOrderItem } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { User } from '../models/user.model.js';
import { paymentService } from './payment/payment.service.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import {
  InitiateOrderInput,
  VerifyPaymentInput,
  OrderQueryInput,
  ReturnOrderInput,
} from '../validators/order.validator.js';
import { NotificationService } from './notification.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export class OrderService {
  /**
   * Helper to round monetary amounts to 2 decimal places.
   */
  private round(amt: number): number {
    return Math.round(amt * 100) / 100;
  }

  /**
   * Generates a cryptographically random, collision-resistant order number.
   * Format: ORD-YYYYMMDD-XXXXXX
   */
  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${dateStr}-${randomHex}`;
  }

  /**
   * Generates a unique invoice number.
   * Format: INV-YYYYMMDD-XXXXXX
   */
  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${dateStr}-${randomHex}`;
  }

  /**
   * Deducts inventory atomically with $gte condition to avoid race conditions.
   * Rolls back previously deducted items if any line item fails stock check.
   */
  public async deductInventoryAtomic(
    items: Array<{ product: Types.ObjectId; variantSku?: string; quantity: number; name: string }>
  ): Promise<void> {
    const successfullyDeducted: Array<{ product: Types.ObjectId; variantSku?: string; quantity: number }> = [];

    for (const item of items) {
      if (item.variantSku) {
        const res = await Product.updateOne(
          {
            _id: item.product,
            isActive: true,
            variants: {
              $elemMatch: {
                sku: item.variantSku,
                stock: { $gte: item.quantity },
              },
            },
          },
          {
            $inc: {
              'variants.$.stock': -item.quantity,
              stock: -item.quantity,
            },
          }
        );

        if (res.modifiedCount === 0) {
          await this.rollbackInventory(successfullyDeducted);
          throw new AppError(
            `Item "${item.name}" (variant: ${item.variantSku}) does not have enough stock available.`,
            409,
            'INSUFFICIENT_STOCK'
          );
        }
      } else {
        const res = await Product.updateOne(
          {
            _id: item.product,
            isActive: true,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          }
        );

        if (res.modifiedCount === 0) {
          await this.rollbackInventory(successfullyDeducted);
          throw new AppError(
            `Item "${item.name}" does not have enough stock available.`,
            409,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      successfullyDeducted.push({
        product: item.product,
        variantSku: item.variantSku,
        quantity: item.quantity,
      });
    }
  }

  /**
   * Restores inventory (e.g. on order cancellation or transaction rollback).
   */
  public async rollbackInventory(
    items: Array<{ product: Types.ObjectId; variantSku?: string; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      if (item.variantSku) {
        await Product.updateOne(
          { _id: item.product, 'variants.sku': item.variantSku },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              stock: item.quantity,
            },
          }
        );
      } else {
        await Product.updateOne(
          { _id: item.product },
          {
            $inc: { stock: item.quantity },
          }
        );
      }
    }
  }

  /**
   * Initiates order from the user's active cart.
   */
  public async initiateOrder(
    userId: string,
    input: InitiateOrderInput
  ): Promise<{ order: IOrder; paymentPayload?: any }> {
    // 1. Idempotency check: if key supplied, check if order already exists
    if (input.idempotencyKey) {
      const existing = await Order.findOne({
        user: userId,
        idempotencyKey: input.idempotencyKey,
      });
      if (existing && existing.orderStatus !== 'CANCELLED') {
        return { order: existing };
      }
    }

    // 2. Fetch User & Validate Delivery Address ownership
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404, 'USER_NOT_FOUND');
    }

    const selectedAddress = user.addresses.find(
      (a) => a._id && a._id.toString() === input.addressId
    );
    if (!selectedAddress) {
      throw new AppError(
        'Selected delivery address does not exist or does not belong to you',
        404,
        'ADDRESS_NOT_FOUND'
      );
    }

    // 3. Fetch Cart & Validate Items
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
    }

    const orderItems: Array<IOrderItem> = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        throw new AppError(
          'Product in cart is no longer active or available.',
          400,
          'INACTIVE_PRODUCT'
        );
      }

      let currentPrice = product.price;
      let sku = product.SKU;
      let availableStock = product.stock;

      if (item.variantSku) {
        const variant = product.variants.find((v) => v.sku === item.variantSku);
        if (!variant) {
          throw new AppError(
            `Variant "${item.variantSku}" is no longer available.`,
            400,
            'INVALID_VARIANT'
          );
        }
        currentPrice = variant.price;
        sku = variant.sku;
        availableStock = variant.stock;
      }

      if (availableStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Only ${availableStock} units remaining.`,
          409,
          'INSUFFICIENT_STOCK'
        );
      }

      const lineTotal = this.round(currentPrice * item.quantity);
      subtotal += lineTotal;

      const primaryImg = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url;

      orderItems.push({
        product: product._id as Types.ObjectId,
        name: product.name,
        sku,
        variantSku: item.variantSku,
        price: currentPrice,
        quantity: item.quantity,
        lineTotal,
        image: primaryImg,
        returnedQuantity: 0,
      });
    }

    subtotal = this.round(subtotal);

    // Shipping rule: Free for orders >= 1000 (INR) or >= 100 (USD), else 50 / 10
    const currency = env.PAYMENT_CURRENCY || 'INR';
    const freeShippingThreshold = currency === 'INR' ? 1000 : 100;
    const baseShippingFee = currency === 'INR' ? 50 : 10;
    const shippingFee = subtotal >= freeShippingThreshold ? 0 : baseShippingFee;
    const tax = 0; // Nexus configuration foundation
    const totalAmount = this.round(subtotal + shippingFee + tax);

    const orderNumber = this.generateOrderNumber();
    const invoiceNumber = this.generateInvoiceNumber();

    const addressSnapshot = {
      name: user.name,
      phone: user.phone,
      street: selectedAddress.street,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      country: selectedAddress.country,
      isDefault: selectedAddress.isDefault,
    };

    // 4. Handle based on Payment Method
    if (input.paymentMethod === 'COD') {
      // Deduct inventory atomically right away for COD
      await this.deductInventoryAtomic(orderItems);

      const order = await Order.create({
        orderNumber,
        invoiceNumber,
        user: user._id,
        items: orderItems,
        shippingAddress: addressSnapshot,
        subtotal,
        discount: 0,
        tax,
        shippingFee,
        totalAmount,
        currency,
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
        paymentProvider: 'COD',
        orderStatus: 'CONFIRMED',
        statusHistory: [
          {
            status: 'CONFIRMED',
            timestamp: new Date(),
            comment: 'Order placed via Cash on Delivery',
          },
        ],
        idempotencyKey: input.idempotencyKey,
        inventoryDeducted: true,
      });

      // Clear user cart
      cart.items = [] as any;
      await cart.save();

      // Trigger notification and email (idempotent)
      try {
        await NotificationService.createNotification({
          userId: user._id.toString(),
          type: 'ORDER_PLACED',
          title: `Order Placed: #${order.orderNumber}`,
          message: `Your order #${order.orderNumber} for ${order.currency} ${order.totalAmount.toFixed(2)} has been placed successfully via Cash on Delivery.`,
          actionUrl: `/orders/${order.orderNumber}`,
          priority: 'HIGH',
          channel: 'ALL',
          idempotencyKey: `ORDER_NOTIF_${order.orderNumber}`,
        });

        if (user.email) {
          await emailService.sendOrderConfirmationEmail(
            user.email,
            {
              orderNumber: order.orderNumber,
              total: order.totalAmount,
              currency: order.currency,
              items: order.items.map((i: any) => ({
                title: i.name,
                quantity: i.quantity,
                price: i.price,
              })),
              shippingAddress: order.shippingAddress as any,
            },
            user._id.toString()
          );
        }
      } catch (notifErr: any) {
        logger.warn(`Failed to dispatch order confirmation notification/email: ${notifErr.message}`);
      }

      return { order };
    }

    // Online Payment: Create pending order first
    const provider = paymentService.getProvider(input.paymentMethod);
    const paymentOrderResult = await provider.createOrder({
      amount: totalAmount,
      currency,
      receipt: orderNumber,
      notes: {
        userId: userId.toString(),
        orderNumber,
      },
    });

    const order = await Order.create({
      orderNumber,
      invoiceNumber,
      user: user._id,
      items: orderItems,
      shippingAddress: addressSnapshot,
      subtotal,
      discount: 0,
      tax,
      shippingFee,
      totalAmount,
      currency,
      paymentStatus: 'PENDING',
      paymentMethod: input.paymentMethod,
      paymentProvider: provider.name,
      paymentOrderId: paymentOrderResult.providerOrderId,
      orderStatus: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          comment: `Order initiated via ${input.paymentMethod}, awaiting payment`,
        },
      ],
      idempotencyKey: input.idempotencyKey,
      inventoryDeducted: false,
    });

    return {
      order,
      paymentPayload: paymentOrderResult,
    };
  }

  /**
   * Verifies digital payment signature and confirms online order atomically.
   */
  public async verifyPayment(userId: string, input: VerifyPaymentInput): Promise<IOrder> {
    const order = await Order.findOne({
      _id: input.orderId,
      user: userId,
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    // Idempotency: If already paid, safely return existing order
    if (order.paymentStatus === 'PAID') {
      return order;
    }

    const provider = paymentService.getProvider(order.paymentMethod);
    const isValid = provider.verifySignature({
      orderId: order.paymentOrderId || '',
      paymentId: input.paymentId,
      signature: input.signature,
    });

    if (!isValid) {
      order.paymentStatus = 'FAILED';
      order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date(),
        comment: 'Payment signature verification failed',
      });
      await order.save();
      throw new AppError(
        'Payment signature verification failed. The transaction cannot be confirmed.',
        400,
        'PAYMENT_VERIFICATION_FAILED'
      );
    }

    // Deduct inventory atomically
    if (!order.inventoryDeducted) {
      await this.deductInventoryAtomic(order.items as any);
      order.inventoryDeducted = true;
    }

    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.paymentTransactionId = input.paymentId;
    order.paymentSignature = input.signature;
    order.paymentVerifiedAt = new Date();
    order.transactionReference = input.paymentId;

    order.statusHistory.push({
      status: 'CONFIRMED',
      timestamp: new Date(),
      comment: `Payment verified via ${order.paymentProvider} (Txn: ${input.paymentId})`,
    });

    await order.save();

    // Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    // Trigger notification and email
    try {
      await NotificationService.createNotification({
        userId,
        type: 'PAYMENT_SUCCESS',
        title: `Payment Received: Order #${order.orderNumber}`,
        message: `Your payment of ${order.currency} ${order.totalAmount.toFixed(2)} was successfully processed. Order #${order.orderNumber} is confirmed!`,
        actionUrl: `/orders/${order.orderNumber}`,
        priority: 'HIGH',
        channel: 'ALL',
        idempotencyKey: `PAYMENT_SUCCESS_${order.orderNumber}`,
      });

      const user = await User.findById(userId).select('email');
      if (user?.email) {
        await emailService.sendOrderConfirmationEmail(
          user.email,
          {
            orderNumber: order.orderNumber,
            total: order.totalAmount,
            currency: order.currency,
            items: order.items.map((i: any) => ({
              title: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            shippingAddress: order.shippingAddress as any,
          },
          userId
        );
      }
    } catch (notifErr: any) {
      logger.warn(`Failed to dispatch payment success notification/email: ${notifErr.message}`);
    }

    return order;
  }

  /**
   * Cancels order, restoring inventory atomically and handling refund.
   */
  public async cancelOrder(userId: string, orderId: string, reason: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus === 'CANCELLED') {
      throw new AppError('This order is already cancelled.', 400, 'ALREADY_CANCELLED');
    }

    const cancellableStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      throw new AppError(
        `Order is in "${order.orderStatus}" stage and can no longer be cancelled directly. You can request a return after delivery.`,
        400,
        'CANNOT_CANCEL_ORDER'
      );
    }

    // Atomic restoration of inventory if previously deducted
    if (order.inventoryDeducted) {
      await this.rollbackInventory(order.items as any);
      order.inventoryDeducted = false;
    }

    // Handle refund if already paid
    if (order.paymentStatus === 'PAID' && order.paymentTransactionId) {
      try {
        const provider = paymentService.getProvider(order.paymentMethod);
        const refundResult = await provider.refund({
          paymentId: order.paymentTransactionId,
          amount: order.totalAmount,
          reason,
        });

        order.refund = {
          amount: order.totalAmount,
          refundId: refundResult.refundId,
          status: 'PROCESSED',
          processedAt: new Date(),
        };
        order.paymentStatus = 'REFUNDED';
      } catch {
        // Record refund as pending if automated refund fails or provider not fully configured
        order.refund = {
          amount: order.totalAmount,
          status: 'PENDING',
        };
      }
    }

    order.orderStatus = 'CANCELLED';
    order.cancellation = {
      cancelledAt: new Date(),
      reason,
      cancelledBy: new Types.ObjectId(userId),
    };

    order.statusHistory.push({
      status: 'CANCELLED',
      timestamp: new Date(),
      comment: `Order cancelled: ${reason}`,
    });

    await order.save();
    return order;
  }

  /**
   * Submits return request for delivered order.
   */
  public async requestReturn(
    userId: string,
    orderId: string,
    input: ReturnOrderInput
  ): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.orderStatus !== 'DELIVERED') {
      throw new AppError(
        'Returns are only permissible after the order has been delivered.',
        400,
        'NOT_ELIGIBLE_FOR_RETURN'
      );
    }

    // Verify return window (configured in env, default 14 days)
    const returnWindowMs = env.RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const deliveredTime = order.updatedAt.getTime();
    if (Date.now() - deliveredTime > returnWindowMs) {
      throw new AppError(
        `Return window of ${env.RETURN_WINDOW_DAYS} days has expired.`,
        400,
        'RETURN_WINDOW_EXPIRED'
      );
    }

    const validatedReturnItems: Array<{
      product: Types.ObjectId;
      sku?: string;
      quantity: number;
      refundAmount: number;
    }> = [];

    let totalRefund = 0;

    for (const reqItem of input.items) {
      const orderItem = order.items.find(
        (i) =>
          i.product.toString() === reqItem.productId &&
          (!reqItem.variantSku || i.variantSku === reqItem.variantSku)
      );

      if (!orderItem) {
        throw new AppError(
          'Item does not belong to this order.',
          400,
          'INVALID_RETURN_ITEM'
        );
      }

      const alreadyReturned = orderItem.returnedQuantity || 0;
      const maxReturnable = orderItem.quantity - alreadyReturned;

      if (reqItem.quantity > maxReturnable) {
        throw new AppError(
          `Cannot return ${reqItem.quantity} units of "${orderItem.name}". Maximum returnable quantity is ${maxReturnable}.`,
          400,
          'EXCESSIVE_RETURN_QUANTITY'
        );
      }

      const itemRefund = this.round(orderItem.price * reqItem.quantity);
      totalRefund += itemRefund;

      validatedReturnItems.push({
        product: orderItem.product,
        sku: orderItem.sku || orderItem.variantSku,
        quantity: reqItem.quantity,
        refundAmount: itemRefund,
      });

      orderItem.returnedQuantity = alreadyReturned + reqItem.quantity;
    }

    order.orderStatus = 'RETURN_REQUESTED';
    order.returnRequest = {
      requestedAt: new Date(),
      reason: input.reason,
      details: input.details,
      status: 'REQUESTED',
      items: validatedReturnItems,
    };

    order.statusHistory.push({
      status: 'RETURN_REQUESTED',
      timestamp: new Date(),
      comment: `Return requested for items (estimated refund: ${totalRefund}): ${input.reason}`,
    });

    await order.save();
    return order;
  }

  /**
   * Retrieves paginated orders for authenticated user with status filtering.
   */
  public async getUserOrders(
    userId: string,
    query: OrderQueryInput
  ): Promise<{
    orders: IOrder[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const filter: any = { user: userId };
    if (query.status) {
      filter.orderStatus = query.status;
    }
    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders as any,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single order by ID with strict ownership validation (IDOR prevention).
   */
  public async getOrderById(userId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      throw new AppError('Order not found or does not belong to you', 404, 'ORDER_NOT_FOUND');
    }

    return order;
  }

  /**
   * Generates structured invoice data snapshot for an order.
   */
  public async getOrderInvoice(userId: string, orderId: string): Promise<any> {
    const order = await this.getOrderById(userId, orderId);

    return {
      invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      invoiceDate: order.createdAt,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      customer: {
        name: order.shippingAddress.name || 'Valued Customer',
        phone: order.shippingAddress.phone,
      },
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress || order.shippingAddress,
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku || item.variantSku,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.lineTotal,
      })),
      financials: {
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        tax: order.tax,
        totalAmount: order.totalAmount,
      },
    };
  }
}

export const orderService = new OrderService();