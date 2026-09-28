import mongoose from 'mongoose';
import { Review } from '../models/review.model.js';
import { Product } from '../models/product.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export class ReviewAIService {
  /**
   * Generates authentic AI review summary from real customer reviews stored in MongoDB.
   * If fewer than 3 reviews exist, honestly returns an insufficient_data state.
   */
  async getProductReviewSummary(productId: string) {
    const isMongoId = mongoose.Types.ObjectId.isValid(productId);
    let targetProductId = productId;

    if (!isMongoId) {
      const product = await Product.findOne({ slug: productId }).select('_id');
      if (!product) {
        throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
      }
      targetProductId = String(product._id);
    }

    const reviews = await Review.find({
      product: new mongoose.Types.ObjectId(targetProductId),
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (reviews.length < 3) {
      return {
        productId: targetProductId,
        totalReviewsAnalyzed: reviews.length,
        overallSentiment: 'INSUFFICIENT_DATA',
        averageRating: reviews.length > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)) : 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        pros: [],
        cons: [],
        commonTopics: [],
        insufficientData: true,
        insufficientDataReason: 'At least 3 customer reviews are required to generate an authentic AI review summary.',
      };
    }

    // Format for Python AI microservice
    const reviewItems = reviews.map((r: any) => ({
      id: String(r._id),
      rating: r.rating,
      title: r.title || '',
      comment: r.comment,
      is_verified_purchase: r.isVerifiedPurchase || false,
    }));

    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/reviews/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: targetProductId,
          reviews: reviewItems,
        }),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        return {
          productId: data.product_id,
          totalReviewsAnalyzed: data.total_reviews_analyzed,
          overallSentiment: data.overall_sentiment,
          averageRating: data.average_rating,
          sentimentDistribution: data.sentiment_distribution,
          pros: data.pros,
          cons: data.cons,
          commonTopics: data.common_topics,
          insufficientData: data.insufficient_data,
          insufficientDataReason: data.insufficient_data_reason,
        };
      }
    } catch (err: any) {
      logger.warn(`AI Review Summarizer unavailable: ${err.message}. Falling back to baseline calculations.`);
    }

    // Fallback: statistical calculation from MongoDB ratings
    const avgRating = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1));
    const pos = reviews.filter((r) => r.rating >= 4).length;
    const neg = reviews.filter((r) => r.rating <= 2).length;
    const neu = reviews.length - pos - neg;

    return {
      productId: targetProductId,
      totalReviewsAnalyzed: reviews.length,
      overallSentiment: pos > neg ? 'PREDOMINANTLY_POSITIVE' : neg > pos ? 'PREDOMINANTLY_NEGATIVE' : 'MIXED_FEEDBACK',
      averageRating: avgRating,
      sentimentDistribution: { positive: pos, neutral: neu, negative: neg },
      pros: reviews.filter((r) => r.rating >= 4).slice(0, 3).map((r) => r.comment.slice(0, 100)),
      cons: reviews.filter((r) => r.rating <= 2).slice(0, 3).map((r) => r.comment.slice(0, 100)),
      commonTopics: ['General Customer Feedback'],
      insufficientData: false,
      fallback: true,
    };
  }

  /**
   * Evaluates reviews for admin moderation assistance (spam/abuse detection).
   */
  async analyzeReviewsForModeration(limit: number = 20) {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('product', 'name slug SKU')
      .populate('user', 'name email')
      .lean();

    if (reviews.length === 0) {
      return { reviews: [], total: 0 };
    }

    const reviewItems = reviews.map((r: any) => ({
      id: String(r._id),
      rating: r.rating,
      title: r.title || '',
      comment: r.comment,
      is_verified_purchase: r.isVerifiedPurchase || false,
    }));

    let aiFlags: Record<string, any> = {};

    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/reviews/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewItems }),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        data.results.forEach((item: any) => {
          aiFlags[item.review_id] = item;
        });
      }
    } catch (err: any) {
      logger.warn(`AI Review Moderation service unavailable: ${err.message}`);
    }

    return {
      reviews: reviews.map((r: any) => ({
        ...r,
        aiEvaluation: aiFlags[String(r._id)] || {
          sentiment: r.rating >= 4 ? 'POSITIVE' : r.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
          sentiment_score: (r.rating - 3) / 2,
          flag: 'CLEAN',
          flag_reason: null,
          fallback: true,
        },
      })),
      total: reviews.length,
    };
  }
}

export const reviewAIService = new ReviewAIService();
