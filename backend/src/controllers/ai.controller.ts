import { Request, Response, NextFunction } from 'express';
import {
  smartSearchQuerySchema,
  assistantChatSchema,
  reviewSummaryParamSchema,
} from '../validators/ai.validator.js';
import { smartSearchService } from '../services/smartSearch.service.js';
import { assistantService } from '../services/assistant.service.js';
import { reviewAIService } from '../services/reviewAI.service.js';
import { sendSuccess } from '../utils/response.js';

export class AIController {
  async smartSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = smartSearchQuerySchema.parse(req.query);

      const result = await smartSearchService.search({
        query: query.q,
        limit: query.limit,
        page: query.page,
        sort: query.sort,
      });

      sendSuccess(res, result, 200, { message: 'Smart search results retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async assistantChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = assistantChatSchema.parse(req.body);
      const userId = req.user ? req.user._id : undefined;
      const headerSession = req.headers['x-session-token'];
      const sessionToken =
        body.sessionToken ||
        (Array.isArray(headerSession) ? headerSession[0] : headerSession) ||
        undefined;

      const result = await assistantService.chat({
        message: body.message,
        conversationHistory: body.conversationHistory,
        userId,
        sessionToken,
      });

      sendSuccess(res, result, 200, { message: 'Assistant response generated' });
    } catch (error) {
      next(error);
    }
  }

  async getReviewSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = reviewSummaryParamSchema.parse(req.params);

      const result = await reviewAIService.getProductReviewSummary(params.productId);

      sendSuccess(res, result, 200, { message: 'Review summary retrieved' });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
