import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  variantSku?: string;
  quantity: number;
  priceAtAddition: number;
}

export interface ICart extends Document {
  user: Types.ObjectId;
  items: Types.DocumentArray<ICartItem & Document>;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Cart item product reference is required'],
    },
    variantSku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity cannot exceed 50 per item'],
      default: 1,
    },
    priceAtAddition: {
      type: Number,
      required: [true, 'Price at addition is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart must belong to a user'],
      unique: true,
    },
    items: {
      type: [CartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
export const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
