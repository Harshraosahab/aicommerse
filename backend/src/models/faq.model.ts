import mongoose, { Document, Schema, Model } from 'mongoose';

export type FAQCategory =
  | 'Ordering'
  | 'Payments'
  | 'Shipping & Delivery'
  | 'Returns & Refunds'
  | 'Account & Security'
  | 'Product & Inventory';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: FAQCategory;
  slug: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true,
      maxlength: [300, 'Question cannot exceed 300 characters'],
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required'],
      trim: true,
      maxlength: [5000, 'Answer cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: [
        'Ordering',
        'Payments',
        'Shipping & Delivery',
        'Returns & Refunds',
        'Account & Security',
        'Product & Inventory',
      ],
      required: [true, 'FAQ category is required'],
    },
    slug: {
      type: String,
      required: [true, 'FAQ slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

FAQSchema.index({ category: 1, isPublished: 1, order: 1 });

export const FAQ: Model<IFAQ> =
  mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);
