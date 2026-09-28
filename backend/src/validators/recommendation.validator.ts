import { z } from 'zod';

export const personalizedRecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(8),
  sessionToken: z.string().trim().optional(),
});

export const similarProductsParamSchema = z.object({
  productId: z.string().trim().min(1),
});

export const similarProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(8),
});

export const trendingProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(8),
  period: z.enum(['today', '7d', '30d', 'all']).default('30d'),
});
