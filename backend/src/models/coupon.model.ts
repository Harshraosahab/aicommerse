import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minimumOrderValue: number;
  maximumDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  applicableProducts: Types.ObjectId[];
  applicableCategories: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [3, 'Coupon code must be at least 3 characters long'],
      maxlength: [30, 'Coupon code cannot exceed 30 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['PERCENTAGE', 'FIXED_AMOUNT'],
        message: '{VALUE} is not a valid coupon type',
      },
      required: [true, 'Coupon type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Coupon discount value is required'],
      min: [0, 'Coupon discount value cannot be negative'],
    },
    minimumOrderValue: {
      type: Number,
      min: [0, 'Minimum order value cannot be negative'],
      default: 0,
    },
    maximumDiscount: {
      type: Number,
      min: [0, 'Maximum discount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CouponSchema.index({ isActive: 1, expiryDate: 1 });

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
