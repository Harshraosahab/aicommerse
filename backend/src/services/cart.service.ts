import mongoose from 'mongoose';
import { Cart, ICart } from '../models/cart.model.js';
import { Product, IProduct } from '../models/product.model.js';
import { AppError } from '../utils/errors.js';

export interface CartItemDetail {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  variantSku?: string;
  variantName?: string;
  quantity: number;
  currentPrice: number;
  priceAtAddition: number;
  priceChanged: boolean;
  lineTotal: number;
  stockAvailable: number;
  isAvailable: boolean;
  stockIssue?: string;
}

export interface CartCalculationResult {
  cartId: string;
  items: CartItemDetail[];
  itemCount: number;
  subtotal: number;
  hasUnavailableItems: boolean;
  hasPriceChanges: boolean;
}

export class CartService {
  /**
   * Helper to round monetary amounts to two decimal places safely.
   */
  private roundMoney(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Get or create active user cart in MongoDB.
   */
  async getOrCreateUserCart(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
  }

  /**
   * Retrieve current cart with full dynamic real-time price & stock validation from MongoDB.
   */
  async getCart(userId: string): Promise<CartCalculationResult> {
    const cart = await this.getOrCreateUserCart(userId);

    // Populate current product records
    await cart.populate({
      path: 'items.product',
      select: 'name slug price compareAtPrice discount stock isActive images variants SKU brand',
      populate: { path: 'brand', select: 'name slug' },
    });

    const itemDetails: CartItemDetail[] = [];
    let subtotal = 0;
    let itemCount = 0;
    let hasUnavailableItems = false;
    let hasPriceChanges = false;

    for (const item of cart.items) {
      const product = item.product as unknown as IProduct;

      // Check if product was removed from database
      if (!product || !product.isActive) {
        hasUnavailableItems = true;
        itemDetails.push({
          _id: item._id ? item._id.toString() : '',
          productId: product ? product._id.toString() : '',
          name: product ? product.name : 'Unavailable Product',
          slug: product ? product.slug : '',
          image: '',
          variantSku: item.variantSku,
          quantity: item.quantity,
          currentPrice: 0,
          priceAtAddition: item.priceAtAddition,
          priceChanged: false,
          lineTotal: 0,
          stockAvailable: 0,
          isAvailable: false,
          stockIssue: 'Product is no longer available or has been deactivated.',
        });
        continue;
      }

      // Check variant if item specifies variantSku
      let effectivePrice = product.price;
      let effectiveStock = product.stock;
      let variantName: string | undefined;
      let isAvailable = true;
      let stockIssue: string | undefined;

      if (item.variantSku) {
        const variant = product.variants.find(
          (v) => v.sku.toUpperCase() === item.variantSku?.toUpperCase()
        );
        if (!variant) {
          isAvailable = false;
          stockIssue = 'Selected variant (' + item.variantSku + ') is no longer available.';
        } else {
          effectivePrice = variant.price;
          effectiveStock = variant.stock;
          variantName = variant.name;
        }
      }

      // Validate stock availability
      if (effectiveStock <= 0) {
        isAvailable = false;
        stockIssue = 'This item is currently out of stock.';
      } else if (item.quantity > effectiveStock) {
        isAvailable = false;
        stockIssue = 'Requested quantity exceeds available stock (' + effectiveStock + ' left).';
      }

      if (!isAvailable) {
        hasUnavailableItems = true;
      }

      // Check price changes since addition
      const priceChanged = this.roundMoney(effectivePrice) !== this.roundMoney(item.priceAtAddition);
      if (priceChanged) {
        hasPriceChanges = true;
      }

      const lineTotal = this.roundMoney(effectivePrice * item.quantity);
      subtotal += lineTotal;
      itemCount += item.quantity;

      const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];

      itemDetails.push({
        _id: item._id ? item._id.toString() : '',
        productId: product._id.toString(),
        name: product.name,
        slug: product.slug,
        image: primaryImg ? primaryImg.url : '',
        variantSku: item.variantSku,
        variantName,
        quantity: item.quantity,
        currentPrice: this.roundMoney(effectivePrice),
        priceAtAddition: this.roundMoney(item.priceAtAddition),
        priceChanged,
        lineTotal,
        stockAvailable: effectiveStock,
        isAvailable,
        stockIssue,
      });
    }

    return {
      cartId: cart._id.toString(),
      items: itemDetails,
      itemCount,
      subtotal: this.roundMoney(subtotal),
      hasUnavailableItems,
      hasPriceChanges,
    };
  }

  /**
   * Add an item to the authenticated user's cart in MongoDB.
   */
  async addItem(
    userId: string,
    productId: string,
    variantSku?: string,
    quantity: number = 1
  ): Promise<CartCalculationResult> {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID.', 400, 'INVALID_PRODUCT_ID');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or currently inactive.', 404, 'PRODUCT_NOT_FOUND');
    }

    let activePrice = product.price;
    let availableStock = product.stock;

    // Validate variant if provided or required
    if (variantSku) {
      const variant = product.variants.find(
        (v) => v.sku.toUpperCase() === variantSku.trim().toUpperCase()
      );
      if (!variant) {
        throw new AppError('Specified product variant was not found.', 404, 'VARIANT_NOT_FOUND');
      }
      activePrice = variant.price;
      availableStock = variant.stock;
    } else if (product.variants && product.variants.length > 0) {
      // If product has variants, require selecting one
      throw new AppError('Please select a product variant.', 400, 'VARIANT_REQUIRED');
    }

    if (availableStock <= 0) {
      throw new AppError('Product is currently out of stock.', 400, 'OUT_OF_STOCK');
    }

    const cart = await this.getOrCreateUserCart(userId);

    // Check if item is already in cart
    const normalizedSku = variantSku ? variantSku.trim().toUpperCase() : undefined;
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (normalizedSku ? item.variantSku === normalizedSku : !item.variantSku)
    );

    if (existingIndex > -1) {
      const newQuantity = cart.items[existingIndex].quantity + quantity;
      if (newQuantity > availableStock) {
        throw new AppError(
          'Cannot add more units. Available stock is ' + availableStock + '.',
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      if (newQuantity > 50) {
        throw new AppError('Maximum quantity of 50 per item reached.', 400, 'MAX_QUANTITY_EXCEEDED');
      }
      cart.items[existingIndex].quantity = newQuantity;
      // Refresh price at addition to reflect current addition
      cart.items[existingIndex].priceAtAddition = activePrice;
    } else {
      if (quantity > availableStock) {
        throw new AppError(
          'Requested quantity (' + quantity + ') exceeds available stock (' + availableStock + ').',
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      cart.items.push({
        product: new mongoose.Types.ObjectId(productId),
        variantSku: normalizedSku,
        quantity,
        priceAtAddition: activePrice,
      } as any);
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Update quantity of an existing cart item.
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<CartCalculationResult> {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new AppError('Invalid cart item ID.', 400, 'INVALID_ITEM_ID');
    }

    const cart = await this.getOrCreateUserCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new AppError('Item not found in user cart.', 404, 'ITEM_NOT_FOUND');
    }

    // Validate real-time stock
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw new AppError('Product is no longer available.', 404, 'PRODUCT_UNAVAILABLE');
    }

    let availableStock = product.stock;
    if (item.variantSku) {
      const variant = product.variants.find(
        (v) => v.sku.toUpperCase() === item.variantSku?.toUpperCase()
      );
      if (!variant) {
        throw new AppError('Variant no longer available.', 404, 'VARIANT_UNAVAILABLE');
      }
      availableStock = variant.stock;
    }

    if (quantity > availableStock) {
      throw new AppError(
        'Requested quantity exceeds available stock (' + availableStock + ' left).',
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    item.quantity = quantity;
    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Remove item from cart.
   */
  async removeItem(userId: string, itemId: string): Promise<CartCalculationResult> {
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new AppError('Invalid cart item ID.', 400, 'INVALID_ITEM_ID');
    }

    const cart = await this.getOrCreateUserCart(userId);
    const item = cart.items.id(itemId);

    if (!item) {
      throw new AppError('Item not found in user cart.', 404, 'ITEM_NOT_FOUND');
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Clear all items from user's cart.
   */
  async clearCart(userId: string): Promise<CartCalculationResult> {
    const cart = await this.getOrCreateUserCart(userId);
    cart.items = [] as any;
    await cart.save();
    return this.getCart(userId);
  }
}

export const cartService = new CartService();
