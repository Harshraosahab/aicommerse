import { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../services/checkout.service.js';
import { sendSuccess } from '../utils/response.js';

export class CheckoutController {
  /**
   * GET /api/v1/checkout/summary
   */
  async getCheckoutSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user._id.toString();
      const addressId = typeof req.query.addressId === 'string' ? req.query.addressId : undefined;
      const summary = await checkoutService.getCheckoutSummary(userId, addressId);
      sendSuccess(res, summary, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
