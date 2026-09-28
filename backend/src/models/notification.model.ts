import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type NotificationType =
  // Order
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_UPDATE'
  // Payment
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REFUNDED'
  // Returns
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'RETURN_PICKUP'
  | 'RETURN_RECEIVED'
  | 'REFUND_INITIATED'
  | 'REFUND_COMPLETED'
  | 'REFUND_FAILED'
  // Product
  | 'PRICE_DROP'
  | 'BACK_IN_STOCK'
  | 'WISHLIST_UPDATE'
  | 'INVENTORY'
  // Account
  | 'EMAIL_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'SECURITY_ALERT'
  | 'ACCOUNT'
  // Marketing
  | 'PROMOTION'
  | 'COUPON'
  | 'FLASH_SALE'
  // Support
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_REPLY'
  | 'SUPPORT_STATUS_CHANGED'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'ALL';
export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  channel: NotificationChannel;
  deliveryStatus: NotificationDeliveryStatus;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'PUSH', 'ALL'],
      default: 'IN_APP',
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      default: 'DELIVERED',
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
