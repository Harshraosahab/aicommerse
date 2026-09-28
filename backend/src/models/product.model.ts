import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IProductAttribute {
  name: string;
  value: string;
}

export interface IProductVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: IProductAttribute[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: Types.ObjectId;
  category: Types.ObjectId;
  subcategory?: Types.ObjectId;
  images: IProductImage[];
  price: number;
  compareAtPrice?: number;
  discount: number;
  stock: number;
  SKU: string;
  tags: string[];
  specifications: IProductAttribute[];
  attributes: IProductAttribute[];
  variants: IProductVariant[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const ProductAttributeSchema = new Schema<IProductAttribute>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    price: { type: Number, required: true, min: [0, 'Variant price cannot be negative'] },
    stock: { type: Number, required: true, min: [0, 'Variant stock cannot be negative'], default: 0 },
    attributes: [ProductAttributeSchema],
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters'],
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product primary category is required'],
    },
    subcategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    images: {
      type: [ProductImageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Product price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: [0, 'Compare-at price cannot be negative'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%'],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    SKU: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    specifications: [ProductAttributeSchema],
    attributes: [ProductAttributeSchema],
    variants: [ProductVariantSchema],
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: [0, 'Review count cannot be negative'],
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Query Indexes
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ isActive: 1, category: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, brand: 1, createdAt: -1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isActive: 1, isNewArrival: 1 });
ProductSchema.index({ isActive: 1, isBestseller: 1 });
ProductSchema.index({ slug: 1, isActive: 1 });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
