import mongoose from 'mongoose';
import { Wishlist, IWishlist } from '../models/wishlist.model.js';
import { Product, IProduct } from '../models/product.model.js';
import { cartService, CartCalculationResult } from './cart.service.js';
import { AppError } from '../utils/errors.js';

export interface WishlistItemDetail {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  variantSku?: string;
  variantName?: string;
  currentPrice: number;
  stockAvailable: number;
  isAvailable: boolean;
  addedAt: Date;
}

export interface WishlistResult {
  wishlistId: string;
  items: WishlistItemDetail[];
  itemCount: number;
}

export class WishlistService {
  /**
   * Get or create user wishlist in MongoDB.
   */
  async getOrCreateUserWishlist(userId: string): Promise<IWishlist> {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, items: [] });
    }
    return wishlist;
  }

  /**
   * Get authenticated user's wishlist with populated current product details.
   */
  async getWishlist(userId: string): Promise<WishlistResult> {
    const wishlist = await this.getOrCreateUserWishlist(userId);

    await wishlist.populate({
      path: 'items.product',
      select: 'name slug price compareAtPrice discount stock isActive images variants SKU brand',
      populate: { path: 'brand', select: 'name slug' },
    });

    const items: WishlistItemDetail[] = [];

    for (const item of wishlist.items) {
      const product = item.product as unknown as IProduct;

      if (!product || !product.isActive) {
        items.push({
          _id: item._id ? item._id.toString() : '',
          productId: product ? product._id.toString() : '',
          name: product ? product.name : 'Unavailable Product',
          slug: product ? product.slug : '',
          image: '',
          variantSku: item.variantSku,
          currentPrice: 0,
          stockAvailable: 0,
          isAvailable: false,
          addedAt: item.addedAt,
        });
        continue;
      }

      let price = product.price;
      let stock = product.stock;
      let variantName: string | undefined;
      let isAvailable = product.stock > 0;

      if (item.variantSku) {
        const variant = product.variants.find(
          (v) => v.sku.toUpperCase() === item.variantSku?.toUpperCase()
        );
        if (variant) {
          price = variant.price;
          stock = variant.stock;
          variantName = variant.name;
          isAvailable = variant.stock > 0;
        } else {
          isAvailable = false;
        }
      }

      const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];

      items.push({
        _id: item._id ? item._id.toString() : '',
        productId: product._id.toString(),
        name: product.name,
        slug: product.slug,
        image: primaryImg ? primaryImg.url : '',
        variantSku: item.variantSku,
        variantName,
        currentPrice: Math.round(price * 100) / 100,
        stockAvailable: stock,
        isAvailable,
        addedAt: item.addedAt,
      });
    }

    return {
      wishlistId: wishlist._id.toString(),
      items,
      itemCount: items.length,
    };
  }

  /**
   * Add a product/variant to user wishlist.
   */
  async addItem(userId: string, productId: string, variantSku?: string): Promise<WishlistResult> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_PRODUCT_ID');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or inactive.', 404, 'PRODUCT_NOT_FOUND');
    }

    const normalizedSku = variantSku ? variantSku.trim().toUpperCase() : undefined;
    if (normalizedSku) {
      const variant = product.variants.find((v) => v.sku.toUpperCase() === normalizedSku);
      if (!variant) {
        throw new AppError('Product variant not found.', 404, 'VARIANT_NOT_FOUND');
      }
    }

    const wishlist = await this.getOrCreateUserWishlist(userId);

    // Prevent duplicate entries
    const exists = wishlist.items.some(
      (item) =>
        item.product.toString() === productId &&
        (normalizedSku ? item.variantSku === normalizedSku : !item.variantSku)
    );

    if (exists) {
      throw new AppError('Item is already in your wishlist.', 409, 'ALREADY_IN_WISHLIST');
    }

    wishlist.items.push({
      product: new mongoose.Types.ObjectId(productId),
      variantSku: normalizedSku,
      addedAt: new Date(),
    } as any);

    await wishlist.save();
    return this.getWishlist(userId);
  }

  /**
   * Remove item from wishlist.
   */
  async removeItem(userId: string, productId: string, variantSku?: string): Promise<WishlistResult> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_PRODUCT_ID');
    }

    const wishlist = await this.getOrCreateUserWishlist(userId);
    const normalizedSku = variantSku ? variantSku.trim().toUpperCase() : undefined;

    const initialLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter((item) => {
      const matchProduct = item.product.toString() === productId;
      const matchSku = normalizedSku ? item.variantSku === normalizedSku : true;
      return !(matchProduct && matchSku);
    }) as any;

    if (wishlist.items.length === initialLength) {
      throw new AppError('Item not found in wishlist.', 404, 'ITEM_NOT_FOUND');
    }

    await wishlist.save();
    return this.getWishlist(userId);
  }

  /**
   * Move an item from wishlist to cart.
   */
  async moveToCart(
    userId: string,
    productId: string,
    variantSku?: string
  ): Promise<{ cart: CartCalculationResult; wishlist: WishlistResult }> {
    // 1. Add to cart first (enforces stock & product validation)
    const updatedCart = await cartService.addItem(userId, productId, variantSku, 1);

    // 2. Remove from wishlist only after successful cart addition
    await this.removeItem(userId, productId, variantSku);
    const updatedWishlist = await this.getWishlist(userId);

    return {
      cart: updatedCart,
      wishlist: updatedWishlist,
    };
  }

  /**
   * Clear all items in user wishlist.
   */
  async clearWishlist(userId: string): Promise<WishlistResult> {
    const wishlist = await this.getOrCreateUserWishlist(userId);
    wishlist.items = [] as any;
    await wishlist.save();
    return this.getWishlist(userId);
  }
}

export const wishlistService = new WishlistService();
