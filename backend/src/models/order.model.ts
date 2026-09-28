import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { IAddress } from './user.model.js';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface IOrderItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  name: string;
  sku?: string;
  variantSku?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  image?: string;
  returnedQuantity?: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  comment?: string;
}

export interface IOrderTracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}

export interface IOrderCancellation {
  cancelledAt?: Date;
  reason?: string;
  cancelledBy?: Types.ObjectId;
}

export interface IReturnItem {
  product: Types.ObjectId;
  sku?: string;
  quantity: number;
  refundAmount: number;
}

export interface IOrderReturnRequest {
  requestedAt?: Date;
  reason?: string;
  details?: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';
  items: IReturnItem[];
}

export interface IOrderRefund {
  amount?: number;
  refundId?: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  processedAt?: Date;
}

export interface IOrderAddress extends IAddress {
  name?: string;
  phone?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: Types.DocumentArray<IOrderItem & Document>;
  shippingAddress: IOrderAddress;
  billingAddress?: IOrderAddress;
  subtotal: number;
  discount: number;
  tax: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentProvider?: string;
  paymentOrderId?: string;
  paymentTransactionId?: string;
  paymentSignature?: string;
  paymentVerifiedAt?: Date;
  orderStatus: OrderStatus;
  status: OrderStatus;
  statusHistory: IOrderStatusHistory[];
  transactionReference?: string;
  tracking?: IOrderTracking;
  cancellation?: IOrderCancellation;
  returnRequest?: IOrderReturnRequest;
  refund?: IOrderRefund;
  invoiceNumber?: string;
  idempotencyKey?: string;
  inventoryDeducted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Order item product reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Order item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    variantSku: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Item unit price is required'],
      min: [0, 'Item price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Item quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    lineTotal: {
      type: Number,
      min: [0, 'Line total cannot be negative'],
      default: function (this: any) {
        return (this.price || 0) * (this.quantity || 1);
      },
    },
    image: {
      type: String,
      trim: true,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Returned quantity cannot be negative'],
    },
  },
  { _id: true }
);

const AddressSchema = new Schema<IOrderAddress>(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const TrackingSchema = new Schema<IOrderTracking>(
  {
    carrier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    estimatedDelivery: { type: Date },
  },
  { _id: false }
);

const CancellationSchema = new Schema<IOrderCancellation>(
  {
    cancelledAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    refundAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema<IOrderReturnRequest>(
  {
    requestedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true, required: true },
    details: { type: String, trim: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'],
      default: 'REQUESTED',
    },
    items: [ReturnItemSchema],
  },
  { _id: false }
);

const RefundSchema = new Schema<IOrderRefund>(
  {
    amount: { type: Number, min: 0 },
    refundId: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING',
    },
    processedAt: { type: Date },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order must contain at least one item'],
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'Order must contain at least one item',
      ],
    },
    shippingAddress: {
      type: AddressSchema,
      required: [true, 'Shipping address is required'],
    },
    billingAddress: AddressSchema,
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      min: [0, 'Subtotal cannot be negative'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      default: 0,
    },
    tax: {
      type: Number,
      min: [0, 'Tax cannot be negative'],
      default: 0,
    },
    shippingFee: {
      type: Number,
      min: [0, 'Shipping fee cannot be negative'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'AUTHORIZED',
          'PAID',
          'FAILED',
          'CANCELLED',
          'REFUNDED',
          'PARTIALLY_REFUNDED',
        ],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      trim: true,
    },
    paymentProvider: {
      type: String,
      trim: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
    },
    paymentSignature: {
      type: String,
      trim: true,
    },
    paymentVerifiedAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: {
        values: [
          'PENDING',
          'CONFIRMED',
          'PROCESSING',
          'PACKED',
          'SHIPPED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'CANCELLED',
          'RETURN_REQUESTED',
          'RETURNED',
          'REFUNDED',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'PENDING',
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    tracking: TrackingSchema,
    cancellation: CancellationSchema,
    returnRequest: ReturnRequestSchema,
    refund: RefundSchema,
    invoiceNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
    },
    inventoryDeducted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual alias for orderStatus
OrderSchema.virtual('status')
  .get(function (this: any) {
    return this.orderStatus;
  })
  .set(function (this: any, val: OrderStatus) {
    this.orderStatus = val;
  });

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentOrderId: 1 }, { sparse: true });
OrderSchema.index({ idempotencyKey: 1 }, { sparse: true, unique: true });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
