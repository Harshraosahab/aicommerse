import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId;
  product: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must be associated with a user'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must be associated with a product'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ product: 1, user: 1 });
ReviewSchema.index({ product: 1, isApproved: 1, createdAt: -1 });
ReviewSchema.index({ rating: -1 });
ReviewSchema.index({ createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
