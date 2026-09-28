import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { NotificationService } from './notification.service.js';
import { emailService } from './email.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class AbandonedCartService {
  /**
   * Scans database for genuine abandoned carts:
   * - Cart has >= 1 item
   * - Cart was updated > inactivityHours ago
   * - User hasn't completed an order since the cart was updated
   * - Items are verified to be active and currently in stock
   * - Dispatches communication idempotently per cart update cycle
   */
  static async processAbandonedCarts(inactivityHours: number = 2): Promise<{
    evaluatedCount: number;
    remindedCount: number;
  }> {
    const cutoffDate = new Date(Date.now() - inactivityHours * 60 * 60 * 1000);

    // Find non-empty carts modified before the cutoff date
    const carts = await Cart.find({
      'items.0': { $exists: true },
      updatedAt: { $lte: cutoffDate },
    })
      .populate('user', 'name email notificationPreferences')
      .populate('items.product', 'title name price stock isActive images')
      .lean();

    let remindedCount = 0;

    for (const cart of carts) {
      const user = cart.user as any;
      if (!user || !user.email) continue;

      // Check if user placed an order after or around the time cart was updated
      const recentOrder = await Order.findOne({
        user: user._id,
        createdAt: { $gte: cart.updatedAt },
      });

      if (recentOrder) {
        // User already completed a purchase; not an abandoned cart
        continue;
      }

      // Verify at least one item is active and in stock
      const availableItems: Array<{ title: string; price: number; quantity: number }> = [];
      for (const item of cart.items) {
        const prod = item.product as any;
        if (prod && prod.isActive !== false && (prod.stock ?? 1) > 0) {
          availableItems.push({
            title: prod.title || prod.name || 'Product',
            price: item.priceAtAddition || prod.price || 0,
            quantity: item.quantity,
          });
        }
      }

      if (availableItems.length === 0) {
        continue;
      }

      // Generate idempotency key for this cart's modification timestamp
      const cartTimeKey = new Date(cart.updatedAt).toISOString().slice(0, 13); // Hourly window
      const idempotencyKey = `ABANDONED_CART_${user._id}_${cartTimeKey}`;

      const cartUrl = `${env.CORS_ORIGIN}/cart`;
      const itemCount = availableItems.reduce((acc, i) => acc + i.quantity, 0);

      // In-app notification
      await NotificationService.createNotification({
        userId: user._id.toString(),
        type: 'PROMOTION',
        title: 'Items waiting in your cart!',
        message: `You have ${itemCount} items waiting in your shopping cart. Finish checking out before they sell out!`,
        actionUrl: '/cart',
        priority: 'MEDIUM',
        channel: 'IN_APP',
        idempotencyKey: `NOTIF_${idempotencyKey}`,
      });

      // Email dispatch (respects user preferences & idempotency internally)
      if (user.notificationPreferences?.email?.promotional !== false) {
        await emailService.sendAbandonedCartEmail(
          user.email,
          {
            userName: user.name,
            itemCount,
            items: availableItems,
            cartUrl,
          },
          user._id.toString()
        );
      }

      remindedCount++;
    }

    logger.info(`Abandoned cart job finished: ${carts.length} evaluated, ${remindedCount} reminded`);
    return {
      evaluatedCount: carts.length,
      remindedCount,
    };
  }
}
