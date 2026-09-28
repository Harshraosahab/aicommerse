import { Request, Response, NextFunction } from 'express';
import { trackInteractionSchema } from '../validators/interaction.validator.js';
import { interactionService } from '../services/interaction.service.js';
import { sendSuccess } from '../utils/response.js';

export class InteractionController {
  async trackInteraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = trackInteractionSchema.parse(req.body);

      const userId = req.user ? req.user._id : undefined;
      const headerSession = req.headers['x-session-token'];
      const sessionToken =
        validatedData.sessionToken ||
        (Array.isArray(headerSession) ? headerSession[0] : headerSession) ||
        undefined;

      const interaction = await interactionService.recordInteraction({
        userId,
        sessionToken,
        productId: validatedData.productId,
        action: validatedData.action,
        metadata: validatedData.metadata,
      });

      sendSuccess(
        res,
        {
          id: interaction._id,
          action: interaction.action,
          productId: interaction.product,
          recordedAt: interaction.timestamp,
        },
        201,
        { message: 'Interaction recorded successfully' }
      );
    } catch (error) {
      next(error);
    }
  }
}

export const interactionController = new InteractionController();
