import { Request, Response, NextFunction } from 'express';
import {
  productAnalyzeSchema,
  productDescriptionDraftSchema,
} from '../../validators/ai.validator.js';
import { productAIService } from '../../services/productAI.service.js';
import { reviewAIService } from '../../services/reviewAI.service.js';
import { aiAnalyticsService } from '../../services/admin/aiAnalytics.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AdminAIController {
  async analyzeProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = productAnalyzeSchema.parse(req.body);
      const result = await productAIService.analyzeProduct(body);
      sendSuccess(res, result, 200, { message: 'Product AI analysis complete' });
    } catch (error) {
      next(error);
    }
  }

  async draftDescription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = productDescriptionDraftSchema.parse(req.body);
      const result = await productAIService.draftDescription(body);
      sendSuccess(res, result, 200, { message: 'Product description draft generated' });
    } catch (error) {
      next(error);
    }
  }

  async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiAnalyticsService.getOverviewMetrics();
      sendSuccess(res, result, 200, { message: 'AI overview metrics retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerSegmentation(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiAnalyticsService.getCustomerSegmentation();
      sendSuccess(res, result, 200, { message: 'Customer RFM segmentation retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryInsights(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await aiAnalyticsService.getInventoryDemandInsights();
      sendSuccess(res, result, 200, { message: 'Inventory demand insights retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getModerationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 25;
      const result = await reviewAIService.analyzeReviewsForModeration(limit);
      sendSuccess(res, result, 200, { message: 'Review moderation queue with AI analysis retrieved' });
    } catch (error) {
      next(error);
    }
  }
}

export const adminAIController = new AdminAIController();
