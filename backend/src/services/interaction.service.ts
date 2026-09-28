import mongoose from 'mongoose';
import { Interaction, IInteraction, InteractionAction } from '../models/interaction.model.js';
import { AppError } from '../utils/errors.js';

export interface RecordInteractionParams {
  userId?: string | mongoose.Types.ObjectId;
  sessionToken?: string;
  productId?: string | mongoose.Types.ObjectId;
  action: InteractionAction;
  metadata?: Record<string, any>;
}

export class InteractionService {
  /**
   * Records a user or guest interaction with telemetry deduplication.
   * Ensures genuine tracking without count inflation from rapid double-clicks/refreshes.
   */
  async recordInteraction(params: RecordInteractionParams): Promise<IInteraction> {
    const { userId, sessionToken, productId, action, metadata = {} } = params;

    if (!userId && !sessionToken) {
      throw new AppError('Either authenticated user or sessionToken is required to track interaction', 400, 'VALIDATION_ERROR');
    }

    const userObjectId = userId ? new mongoose.Types.ObjectId(String(userId)) : null;
    const productObjectId = productId ? new mongoose.Types.ObjectId(String(productId)) : null;

    // Deduplication window for VIEW/CLICK events: 5 seconds
    if ((action === 'VIEW' || action === 'CLICK') && productObjectId) {
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const query: any = {
        product: productObjectId,
        action,
        timestamp: { $gte: fiveSecondsAgo },
      };

      if (userObjectId) {
        query.user = userObjectId;
      } else if (sessionToken) {
        query.sessionToken = sessionToken;
      }

      const recentDuplicate = await Interaction.findOne(query);
      if (recentDuplicate) {
        return recentDuplicate;
      }
    }

    const interaction = await Interaction.create({
      user: userObjectId,
      sessionToken: sessionToken || undefined,
      product: productObjectId,
      action,
      metadata,
      timestamp: new Date(),
    });

    return interaction;
  }

  /**
   * Retrieves recent interaction history for a user or guest session token.
   */
  async getUserInteractions(
    userId?: string | mongoose.Types.ObjectId,
    sessionToken?: string,
    limit: number = 50
  ): Promise<IInteraction[]> {
    if (!userId && !sessionToken) {
      return [];
    }

    const conditions: any[] = [];
    if (userId) {
      conditions.push({ user: new mongoose.Types.ObjectId(String(userId)) });
    }
    if (sessionToken) {
      conditions.push({ sessionToken });
    }

    return Interaction.find({ $or: conditions })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('product', 'name slug category brand price tags images SKU isActive stock')
      .lean() as unknown as IInteraction[];
  }
}

export const interactionService = new InteractionService();
