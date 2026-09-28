import { Types } from 'mongoose';
import {
  Notification,
  INotification,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  idempotencyKey?: string;
}

export class NotificationService {
  /**
   * Helper to inspect user preferences before sending notifications via email or in-app.
   */
  private static shouldDeliverChannel(
    user: any,
    type: NotificationType,
    channel: 'email' | 'inApp'
  ): boolean {
    if (!user || !user.notificationPreferences) return true;
    const prefs = user.notificationPreferences[channel];
    if (!prefs) return true;

    // Map NotificationType to preference key
    if (type.startsWith('ORDER_')) {
      return prefs.orderUpdates !== false;
    }
    if (type.startsWith('PAYMENT_')) {
      return prefs.paymentUpdates !== false;
    }
    if (type.startsWith('RETURN_') || type.startsWith('REFUND_')) {
      return prefs.orderUpdates !== false;
    }
    if (type.startsWith('SUPPORT_')) {
      return prefs.supportUpdates !== false;
    }
    if (type === 'PRICE_DROP') {
      return prefs.priceDrop !== false;
    }
    if (type === 'BACK_IN_STOCK') {
      return prefs.backInStock !== false;
    }
    if (type === 'PROMOTION' || type === 'COUPON' || type === 'FLASH_SALE') {
      return prefs.promotional !== false;
    }

    return true;
  }

  /**
   * Dispatches an in-app notification (and optional email) idempotently.
   */
  static async createNotification(input: CreateNotificationInput): Promise<INotification | null> {
    const {
      userId,
      type,
      title,
      message,
      data = {},
      actionUrl,
      priority = 'MEDIUM',
      channel = 'IN_APP',
      idempotencyKey,
    } = input;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        logger.info(`Notification duplicate suppressed: idempotencyKey ${idempotencyKey}`);
        return existing;
      }
    }

    const user = await User.findById(userId).select('email name notificationPreferences');
    if (!user) {
      logger.warn(`Cannot create notification: User ${userId} not found`);
      return null;
    }

    // In-app check
    const allowsInApp =
      channel === 'IN_APP' || channel === 'ALL'
        ? this.shouldDeliverChannel(user, type, 'inApp')
        : false;

    let notificationDoc: INotification | null = null;
    if (allowsInApp) {
      try {
        notificationDoc = await Notification.create({
          user: userId,
          type,
          title,
          message,
          data,
          actionUrl,
          priority,
          channel,
          deliveryStatus: 'DELIVERED',
          idempotencyKey,
        });
      } catch (err: any) {
        if (err.code === 11000 && idempotencyKey) {
          // Idempotency duplicate handled gracefully
          return await Notification.findOne({ idempotencyKey });
        }
        throw err;
      }
    }

    // Email dispatch check
    const allowsEmail =
      channel === 'EMAIL' || channel === 'ALL'
        ? this.shouldDeliverChannel(user, type, 'email')
        : false;

    if (allowsEmail && user.email) {
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: title,
          text: `${message}${actionUrl ? `\n\nView details: ${actionUrl}` : ''}`,
          userId: user._id.toString(),
          type,
          idempotencyKey: idempotencyKey ? `EMAIL_${idempotencyKey}` : undefined,
          metadata: { inAppNotificationId: notificationDoc?._id?.toString() },
        });
      } catch (emailErr: any) {
        logger.warn(`Failed to dispatch email for notification ${type}: ${emailErr.message}`);
      }
    }

    return notificationDoc;
  }

  /**
   * Retrieves paginated notifications for the authenticated user.
   */
  static async getUserNotifications(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      type?: string;
    }
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
    page: number;
    pages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { user: userId };
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);

    return {
      notifications: notifications as unknown as INotification[],
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves strictly the count of unread notifications for navbar bell badges.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ user: userId, isRead: false });
  }

  /**
   * Marks a single notification as read, enforcing user ownership.
   */
  static async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new AppError('Notification not found or unauthorized', 404, 'NOT_FOUND');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Marks all unread notifications as read for the user.
   */
  static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Deletes a notification, ensuring ownership.
   */
  static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId,
    });

    if (result.deletedCount === 0) {
      throw new AppError('Notification not found or unauthorized', 404, 'NOT_FOUND');
    }
  }

  /**
   * Clears all read notifications for user.
   */
  static async clearReadNotifications(userId: string): Promise<{ deletedCount: number }> {
    const result = await Notification.deleteMany({
      user: userId,
      isRead: true,
    });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Admin broadcast functionality for promotional announcements or system notices.
   */
  static async broadcastNotification(input: {
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string;
    targetRole?: string;
  }): Promise<{ sentCount: number }> {
    const userFilter: Record<string, any> = { isActive: true };
    if (input.targetRole) {
      userFilter.role = input.targetRole;
    }

    const users = await User.find(userFilter).select('_id email notificationPreferences');
    let sentCount = 0;

    const notificationBatch = [];
    const now = new Date();

    for (const user of users) {
      if (this.shouldDeliverChannel(user, input.type, 'inApp')) {
        notificationBatch.push({
          user: user._id,
          type: input.type,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          priority: input.priority || 'MEDIUM',
          channel: 'IN_APP',
          deliveryStatus: 'DELIVERED',
          isRead: false,
          createdAt: now,
          updatedAt: now,
        });
        sentCount++;
      }
    }

    if (notificationBatch.length > 0) {
      await Notification.insertMany(notificationBatch);
    }

    return { sentCount };
  }
}
