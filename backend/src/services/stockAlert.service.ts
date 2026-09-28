import { Types } from 'mongoose';
import { Wishlist } from '../models/wishlist.model.js';
import { NotificationService } from './notification.service.js';
import { logger } from '../utils/logger.js';

export class StockAlertService {
  /**
   * Notifies users who have a product in their wishlist when its price drops.
   */
  static async handlePriceDrop(
    productId: string | Types.ObjectId,
    oldPrice: number,
    newPrice: number,
    productName: string,
    productSlug?: string
  ): Promise<number> {
    if (newPrice >= oldPrice) return 0;

    // Find wishlists containing this product
    const wishlists = await Wishlist.find({
      'items.product': productId,
    }).select('user');

    let notifiedCount = 0;
    const savingsPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

    for (const wl of wishlists) {
      try {
        await NotificationService.createNotification({
          userId: wl.user.toString(),
          type: 'PRICE_DROP',
          title: `Price Drop: ${productName}`,
          message: `${productName} is now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}) — save ${savingsPercent}%!`,
          actionUrl: productSlug ? `/products/${productSlug}` : '/wishlist',
          priority: 'MEDIUM',
          channel: 'ALL',
          idempotencyKey: `PRICE_DROP_${wl.user}_${productId}_${newPrice}`,
        });
        notifiedCount++;
      } catch (err: any) {
        logger.warn(`Failed to notify user ${wl.user} about price drop: ${err.message}`);
      }
    }

    logger.info(`Price drop alerts sent for product ${productId}: ${notifiedCount} users notified.`);
    return notifiedCount;
  }

  /**
   * Notifies users when a wishlist item transitions from 0 stock to in-stock (> 0).
   */
  static async handleBackInStock(
    productId: string | Types.ObjectId,
    newStock: number,
    productName: string,
    productSlug?: string
  ): Promise<number> {
    if (newStock <= 0) return 0;

    const wishlists = await Wishlist.find({
      'items.product': productId,
    }).select('user');

    let notifiedCount = 0;

    for (const wl of wishlists) {
      try {
        await NotificationService.createNotification({
          userId: wl.user.toString(),
          type: 'BACK_IN_STOCK',
          title: `Back in Stock: ${productName}`,
          message: `${productName} is back in stock and ready to ship! Grab yours before it's gone.`,
          actionUrl: productSlug ? `/products/${productSlug}` : '/wishlist',
          priority: 'HIGH',
          channel: 'ALL',
          idempotencyKey: `BACK_IN_STOCK_${wl.user}_${productId}_${new Date().toISOString().slice(0, 10)}`,
        });
        notifiedCount++;
      } catch (err: any) {
        logger.warn(`Failed to notify user ${wl.user} about back in stock: ${err.message}`);
      }
    }

    logger.info(`Back in stock alerts sent for product ${productId}: ${notifiedCount} users notified.`);
    return notifiedCount;
  }
}
