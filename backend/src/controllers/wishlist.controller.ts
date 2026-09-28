import { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlist.service.js';
import { sendSuccess } from '../utils/response.js';
import { addToWishlistSchema } from '../validators/cart.validator.js';

export class WishlistController {
  /**
   * GET /api/v1/wishlist
   */
  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const wishlist = await wishlistService.getWishlist(userId);
      sendSuccess(res, wishlist, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/wishlist/items
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const validated = addToWishlistSchema.parse(req.body);
      const wishlist = await wishlistService.addItem(userId, validated.productId, validated.variantSku);
      sendSuccess(res, wishlist, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/wishlist/items/:productId
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
      const variantSku = typeof req.query.variantSku === 'string' ? req.query.variantSku : undefined;
      const wishlist = await wishlistService.removeItem(userId, productId, variantSku);
      sendSuccess(res, wishlist, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/wishlist
   */
  async clearWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const wishlist = await wishlistService.clearWishlist(userId);
      sendSuccess(res, wishlist, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/wishlist/items/:productId/cart
   * Move item from wishlist to cart
   */
  async moveToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
      const variantSku = typeof req.query.variantSku === 'string' ? req.query.variantSku : undefined;
      const result = await wishlistService.moveToCart(userId, productId, variantSku);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const wishlistController = new WishlistController();
