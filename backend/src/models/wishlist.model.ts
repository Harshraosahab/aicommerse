import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IWishlistItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  variantSku?: string;
  addedAt: Date;
}

export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: Types.DocumentArray<IWishlistItem & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Wishlist item product reference is required'],
    },
    variantSku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Wishlist must belong to a user'],
      unique: true,
    },
    items: {
      type: [WishlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
export const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema);
