import mongoose from 'mongoose';
import { Product, IProduct } from '../models/product.model.js';
import { Interaction } from '../models/interaction.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export interface ScoredProduct {
  product: IProduct;
  score: number;
  reason: string;
  matchFactors?: Record<string, number>;
  algorithm: string;
  isColdStart?: boolean;
  fallback?: boolean;
}

export interface RecommendationListResponse {
  recommendations: ScoredProduct[];
  total: number;
  algorithm: string;
  modelVersion: string;
  coldStart: boolean;
  fallback: boolean;
}

const ACTION_WEIGHT_MAP: Record<string, number> = {
  PURCHASE: 5.0,
  ADD_TO_CART: 4.0,
  WISHLIST: 3.0,
  CLICK: 2.0,
  SEARCH: 2.0,
  VIEW: 1.0,
  REMOVE_FROM_CART: -1.0,
};

export class RecommendationService {
  /**
   * Retrieves personalized recommendations for a user (or guest session).
   * Orchestrates interactions -> candidate catalog -> Python AI service -> fallback hierarchy.
   */
  async getPersonalizedRecommendations(params: {
    userId?: string | mongoose.Types.ObjectId;
    sessionToken?: string;
    limit?: number;
  }): Promise<RecommendationListResponse> {
    const { userId, sessionToken, limit = 8 } = params;

    // 1. Fetch user interaction history
    const conditions: any[] = [];
    if (userId) {
      conditions.push({ user: new mongoose.Types.ObjectId(String(userId)) });
    }
    if (sessionToken) {
      conditions.push({ sessionToken });
    }

    const interactions = conditions.length > 0
      ? await Interaction.find({ $or: conditions })
          .sort({ timestamp: -1 })
          .limit(60)
          .populate('product', 'category brand price tags rating reviewCount')
          .lean()
      : [];

    // Track products already purchased to exclude them from recommendations
    const purchasedProductIds = new Set<string>();
    interactions.forEach((item: any) => {
      if (item.action === 'PURCHASE' && item.product?._id) {
        purchasedProductIds.add(String(item.product._id));
      }
    });

    // 2. Cold-start check: If zero interactions, return genuine trending products
    if (interactions.length === 0) {
      const trending = await this.getTrendingProducts({ limit, period: '30d' });
      return {
        recommendations: trending.recommendations.map((r) => ({
          ...r,
          isColdStart: true,
          reason: 'Trending now (popular among shoppers)',
          algorithm: 'cold_start_trending',
        })),
        total: trending.total,
        algorithm: 'cold_start_trending',
        modelVersion: 'v1.0.0-fallback',
        coldStart: true,
        fallback: false,
      };
    }

    // 3. Fetch candidate active products from catalog
    const candidates = await Product.find({
      isActive: true,
      stock: { $gt: 0 },
      _id: { $nin: Array.from(purchasedProductIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(100)
      .lean();

    if (candidates.length === 0) {
      return {
        recommendations: [],
        total: 0,
        algorithm: 'empty_catalog',
        modelVersion: 'v1.0.0',
        coldStart: false,
        fallback: false,
      };
    }

    // Format candidates for AI microservice
    const candidateFeatures = candidates.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      description: p.description || '',
      category_id: String(p.category?._id || p.category || ''),
      brand_id: String(p.brand?._id || p.brand || ''),
      tags: p.tags || [],
      price: p.price || 0,
      rating: p.rating || 0,
      review_count: p.reviewCount || 0,
    }));

    // Format interactions for AI microservice
    const interactionFeatures = interactions
      .filter((i: any) => i.product)
      .map((i: any) => ({
        product_id: String(i.product._id || i.product),
        action: i.action,
        weight: ACTION_WEIGHT_MAP[i.action] || 1.0,
        timestamp: i.timestamp ? i.timestamp.toISOString() : undefined,
        metadata: {
          category_id: String(i.product.category?._id || i.product.category || ''),
          brand_id: String(i.product.brand?._id || i.product.brand || ''),
          tags: i.product.tags || [],
          price: i.product.price || 0,
        },
      }));

    // 4. Call Python AI Microservice with strict timeout guard
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/recommendations/personalized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ? String(userId) : undefined,
          interactions: interactionFeatures,
          candidate_products: candidateFeatures,
          limit,
          exclude_product_ids: Array.from(purchasedProductIds),
        }),
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.cold_start || !data.recommendations || data.recommendations.length === 0) {
          const trending = await this.getTrendingProducts({ limit, period: '30d' });
          return {
            recommendations: trending.recommendations.map((r) => ({
              ...r,
              isColdStart: true,
              reason: 'Trending now (popular among shoppers)',
              algorithm: 'cold_start_trending',
            })),
            total: trending.total,
            algorithm: 'cold_start_trending',
            modelVersion: data.model_version || 'v1.0.0-hybrid',
            coldStart: true,
            fallback: false,
          };
        }

        // Hydrate recommended items preserving AI rank ordering
        const candidateMap = new Map<string, any>();
        candidates.forEach((c: any) => candidateMap.set(String(c._id), c));

        const scored: ScoredProduct[] = [];
        for (const item of data.recommendations) {
          const product = candidateMap.get(item.product_id);
          if (product) {
            scored.push({
              product,
              score: item.score,
              reason: item.reason,
              matchFactors: item.match_factors,
              algorithm: data.algorithm || 'hybrid_interaction_profile',
              isColdStart: false,
              fallback: false,
            });
          }
        }

        return {
          recommendations: scored,
          total: scored.length,
          algorithm: data.algorithm || 'hybrid_interaction_profile',
          modelVersion: data.model_version || 'v1.0.0-hybrid',
          coldStart: false,
          fallback: false,
        };
      }
    } catch (err: any) {
      logger.warn(`AI Service personalized recommendation unavailable or timed out: ${err.message}. Engaging database affinity fallback.`);
    }

    // 5. Resilient Database Fallback: Content & Affinity-based matching from MongoDB
    return this.getDatabaseAffinityFallback(interactions, candidates, limit);
  }

  /**
   * Generates content-based similar products for a target product.
   */
  async getSimilarProducts(params: {
    productId: string;
    limit?: number;
  }): Promise<RecommendationListResponse> {
    const { productId, limit = 8 } = params;

    const isMongoId = mongoose.Types.ObjectId.isValid(productId);
    const targetProduct = await Product.findOne(
      isMongoId ? { _id: productId } : { slug: productId }
    )
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();

    if (!targetProduct) {
      throw new AppError('Product not found for similarity query', 404, 'PRODUCT_NOT_FOUND');
    }

    // Find candidate products in active catalog (excluding target product itself)
    const candidates = await Product.find({
      isActive: true,
      _id: { $ne: targetProduct._id },
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(60)
      .lean();

    if (candidates.length === 0) {
      return {
        recommendations: [],
        total: 0,
        algorithm: 'empty_catalog',
        modelVersion: 'v1.0.0',
        coldStart: false,
        fallback: false,
      };
    }

    const targetFeature = {
      id: String(targetProduct._id),
      name: targetProduct.name,
      description: targetProduct.description || '',
      category_id: String((targetProduct.category as any)?._id || targetProduct.category || ''),
      brand_id: String((targetProduct.brand as any)?._id || targetProduct.brand || ''),
      tags: targetProduct.tags || [],
      price: targetProduct.price || 0,
      rating: targetProduct.rating || 0,
      review_count: targetProduct.reviewCount || 0,
    };

    const candidateFeatures = candidates.map((p: any) => ({
      id: String(p._id),
      name: p.name,
      description: p.description || '',
      category_id: String(p.category?._id || p.category || ''),
      brand_id: String(p.brand?._id || p.brand || ''),
      tags: p.tags || [],
      price: p.price || 0,
      rating: p.rating || 0,
      review_count: p.reviewCount || 0,
    }));

    // Call Python AI Service
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/recommendations/similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_product: targetFeature,
          candidate_products: candidateFeatures,
          limit,
        }),
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const candidateMap = new Map<string, any>();
        candidates.forEach((c: any) => candidateMap.set(String(c._id), c));

        const scored: ScoredProduct[] = [];
        for (const item of data.recommendations || []) {
          const product = candidateMap.get(item.product_id);
          if (product) {
            scored.push({
              product,
              score: item.score,
              reason: item.reason,
              matchFactors: item.match_factors,
              algorithm: data.algorithm || 'multi_feature_content_similarity',
              isColdStart: false,
              fallback: false,
            });
          }
        }

        return {
          recommendations: scored,
          total: scored.length,
          algorithm: data.algorithm || 'multi_feature_content_similarity',
          modelVersion: data.model_version || 'v1.0.0-hybrid',
          coldStart: false,
          fallback: false,
        };
      }
    } catch (err: any) {
      logger.warn(`AI Service similar products timed out/unavailable: ${err.message}. Using DB category/brand fallback.`);
    }

    // Fallback: Query same category or brand products directly from MongoDB
    const fallbackProducts = await Product.find({
      isActive: true,
      _id: { $ne: targetProduct._id },
      $or: [
        { category: (targetProduct.category as any)?._id || targetProduct.category },
        { brand: (targetProduct.brand as any)?._id || targetProduct.brand },
      ],
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(limit)
      .lean();

    return {
      recommendations: fallbackProducts.map((p: any) => ({
        product: p,
        score: 0.75,
        reason: 'Related category and brand catalog match',
        algorithm: 'db_category_brand_fallback',
        fallback: true,
        isColdStart: false,
      })),
      total: fallbackProducts.length,
      algorithm: 'db_category_brand_fallback',
      modelVersion: 'v1.0.0-fallback',
      coldStart: false,
      fallback: true,
    };
  }

  /**
   * Computes trending products from real MongoDB interaction weights and activity.
   */
  async getTrendingProducts(params: {
    limit?: number;
    period?: 'today' | '7d' | '30d' | 'all';
  }): Promise<RecommendationListResponse> {
    const { limit = 8, period = '30d' } = params;

    const dateThreshold = new Date();
    if (period === 'today') dateThreshold.setHours(0, 0, 0, 0);
    else if (period === '7d') dateThreshold.setDate(dateThreshold.getDate() - 7);
    else if (period === '30d') dateThreshold.setDate(dateThreshold.getDate() - 30);
    else dateThreshold.setTime(0);

    // Aggregate interactions by product with real weights
    const trendingAgg = await Interaction.aggregate([
      {
        $match: {
          product: { $ne: null },
          timestamp: { $gte: dateThreshold },
        },
      },
      {
        $addFields: {
          weight: {
            $switch: {
              branches: [
                { case: { $eq: ['$action', 'PURCHASE'] }, then: 5.0 },
                { case: { $eq: ['$action', 'ADD_TO_CART'] }, then: 4.0 },
                { case: { $eq: ['$action', 'WISHLIST'] }, then: 3.0 },
                { case: { $eq: ['$action', 'CLICK'] }, then: 2.0 },
                { case: { $eq: ['$action', 'SEARCH'] }, then: 2.0 },
                { case: { $eq: ['$action', 'VIEW'] }, then: 1.0 },
              ],
              default: 0.0,
            },
          },
        },
      },
      {
        $group: {
          _id: '$product',
          totalScore: { $sum: '$weight' },
          interactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit * 2 },
    ]);

    const productIds = trendingAgg.map((item) => item._id);
    const hydratedProducts = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      stock: { $gt: 0 },
    })
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();

    const productMap = new Map<string, any>();
    hydratedProducts.forEach((p: any) => productMap.set(String(p._id), p));

    const scored: ScoredProduct[] = [];
    for (const agg of trendingAgg) {
      const prod = productMap.get(String(agg._id));
      if (prod) {
        scored.push({
          product: prod,
          score: Math.min(1.0, agg.totalScore / 50.0),
          reason: 'High customer engagement and trending activity',
          algorithm: 'real_interaction_velocity',
          isColdStart: false,
          fallback: false,
        });
        if (scored.length >= limit) break;
      }
    }

    // Backfill with top-rated/bestsellers if telemetry is still accumulating
    if (scored.length < limit) {
      const existingIds = new Set(scored.map((s) => String(s.product._id)));
      const backfills = await Product.find({
        isActive: true,
        stock: { $gt: 0 },
        _id: { $nin: Array.from(existingIds).map((id) => new mongoose.Types.ObjectId(id)) },
      })
        .sort({ isBestseller: -1, rating: -1, reviewCount: -1 })
        .limit(limit - scored.length)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .lean();

      for (const prod of backfills) {
        scored.push({
          product: prod as any,
          score: Math.min(1.0, ((prod.rating || 4.0) / 5.0) * 0.9),
          reason: 'Popular high-rated catalog product',
          algorithm: 'catalog_bestseller_prior',
          isColdStart: false,
          fallback: false,
        });
      }
    }

    return {
      recommendations: scored,
      total: scored.length,
      algorithm: 'trending_engagement',
      modelVersion: 'v1.0.0',
      coldStart: false,
      fallback: false,
    };
  }

  /**
   * Internal DB-level fallback when Python AI engine is offline.
   */
  private async getDatabaseAffinityFallback(
    interactions: any[],
    candidates: any[],
    limit: number
  ): Promise<RecommendationListResponse> {
    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    interactions.forEach((item) => {
      const catId = String(item.product?.category?._id || item.product?.category || '');
      if (catId) {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + (ACTION_WEIGHT_MAP[item.action] || 1);
      }
      if (item.product?.tags && Array.isArray(item.product.tags)) {
        item.product.tags.forEach((tag: string) => {
          const t = tag.toLowerCase();
          tagCounts[t] = (tagCounts[t] || 0) + (ACTION_WEIGHT_MAP[item.action] || 1);
        });
      }
    });

    const topCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

    // Score candidates by database affinity
    const scored: ScoredProduct[] = candidates.map((prod) => {
      const catId = String(prod.category?._id || prod.category || '');
      const catScore = topCategories.includes(catId) ? 0.6 : 0.1;

      let tagScore = 0;
      if (prod.tags) {
        prod.tags.forEach((t: string) => {
          if (tagCounts[t.toLowerCase()]) tagScore += 0.2;
        });
      }
      tagScore = Math.min(0.4, tagScore);

      const score = Math.min(1.0, catScore + tagScore);
      return {
        product: prod,
        score: Math.round(score * 100) / 100,
        reason: 'Recommended based on your browsing categories',
        algorithm: 'db_affinity_fallback',
        fallback: true,
        isColdStart: false,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      recommendations: scored.slice(0, limit),
      total: Math.min(scored.length, limit),
      algorithm: 'db_affinity_fallback',
      modelVersion: 'v1.0.0-fallback',
      coldStart: false,
      fallback: true,
    };
  }
}

export const recommendationService = new RecommendationService();
