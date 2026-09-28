import { z } from 'zod';

export const smartSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).default('relevance'),
  sessionToken: z.string().trim().optional(),
});

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(2000),
      })
    )
    .optional()
    .default([]),
  sessionToken: z.string().trim().optional(),
});

export const productAnalyzeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().optional().default(''),
  brand: z.string().trim().optional().default(''),
  specifications: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        value: z.string().trim().min(1),
      })
    )
    .optional()
    .default([]),
  attributes: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        value: z.string().trim().min(1),
      })
    )
    .optional()
    .default([]),
  existingTags: z.array(z.string().trim()).optional().default([]),
});

export const productDescriptionDraftSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  specifications: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        value: z.string().trim().min(1),
      })
    )
    .optional()
    .default([]),
  attributes: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        value: z.string().trim().min(1),
      })
    )
    .optional()
    .default([]),
  tags: z.array(z.string().trim()).optional().default([]),
});

export const reviewSummaryParamSchema = z.object({
  productId: z.string().trim().min(1),
});

export const aiPeriodQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
});
