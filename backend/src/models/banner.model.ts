import mongoose, { Document, Schema, Model } from 'mongoose';

export type BannerPlacement = 'HERO' | 'SIDEBAR' | 'POPUP' | 'FOOTER';

export interface IBanner extends Document {
  title: string;
  image: string;
  link: string;
  placement: BannerPlacement;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [150, 'Banner title cannot exceed 150 characters'],
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '/',
    },
    placement: {
      type: String,
      enum: {
        values: ['HERO', 'SIDEBAR', 'POPUP', 'FOOTER'],
        message: '{VALUE} is not a valid banner placement',
      },
      default: 'HERO',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BannerSchema.index({ placement: 1, isActive: 1, order: 1 });

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
