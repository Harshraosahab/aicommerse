import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service.js';
import { wishlistService } from '../services/wishlist.service.js';
import { sendSuccess } from '../utils/response.js';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator.js';

export class CartController {
  /**
   * GET /api/v1/cart
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const cart = await cartService.getCart(userId);
      sendSuccess(res, cart, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/items
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const validated = addToCartSchema.parse(req.body);
      const cart = await cartService.addItem(
        userId,
        validated.productId,
        validated.variantSku,
        validated.quantity
      );
      sendSuccess(res, cart, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/cart/items/:itemId
   */
  async updateItemQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const validated = updateCartItemSchema.parse(req.body);
      const cart = await cartService.updateItemQuantity(userId, itemId, validated.quantity);
      sendSuccess(res, cart, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart/items/:itemId
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const cart = await cartService.removeItem(userId, itemId);
      sendSuccess(res, cart, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/cart
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const cart = await cartService.clearCart(userId);
      sendSuccess(res, cart, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/cart/items/:itemId/wishlist
   * Move item from cart to wishlist
   */
  async moveToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const cartResult = await cartService.getCart(userId);
      const item = cartResult.items.find((i) => i._id === itemId);

      if (!item) {
        res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Cart item not found' } });
        return;
      }

      // 1. Add to wishlist
      try {
        await wishlistService.addItem(userId, item.productId, item.variantSku);
      } catch (err: any) {
        // If already in wishlist, ignore conflict and proceed to remove from cart
        if (err.code !== 'ALREADY_IN_WISHLIST') throw err;
      }

      // 2. Remove from cart
      const updatedCart = await cartService.removeItem(userId, itemId);
      sendSuccess(res, updatedCart, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
