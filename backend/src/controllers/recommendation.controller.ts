import { Request, Response, NextFunction } from 'express';
import {
  personalizedRecommendationQuerySchema,
  similarProductsParamSchema,
  similarProductsQuerySchema,
  trendingProductsQuerySchema,
} from '../validators/recommendation.validator.js';
import { recommendationService } from '../services/recommendation.service.js';
import { sendSuccess } from '../utils/response.js';

export class RecommendationController {
  async getPersonalized(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = personalizedRecommendationQuerySchema.parse(req.query);
      const userId = req.user ? req.user._id : undefined;
      const headerSession = req.headers['x-session-token'];
      const sessionToken =
        query.sessionToken ||
        (Array.isArray(headerSession) ? headerSession[0] : headerSession) ||
        undefined;

      const result = await recommendationService.getPersonalizedRecommendations({
        userId,
        sessionToken,
        limit: query.limit,
      });

      sendSuccess(res, result, 200, { message: 'Personalized recommendations retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getSimilar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = similarProductsParamSchema.parse(req.params);
      const query = similarProductsQuerySchema.parse(req.query);

      const result = await recommendationService.getSimilarProducts({
        productId: params.productId,
        limit: query.limit,
      });

      sendSuccess(res, result, 200, { message: 'Similar products retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = trendingProductsQuerySchema.parse(req.query);

      const result = await recommendationService.getTrendingProducts({
        limit: query.limit,
        period: query.period,
      });

      sendSuccess(res, result, 200, { message: 'Trending products retrieved' });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();
