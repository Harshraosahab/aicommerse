import { z } from 'zod';

export const createFAQSchema = z.object({
  body: z.object({
    question: z.string().min(5, 'Question must be at least 5 characters').max(300),
    answer: z.string().min(10, 'Answer must be at least 10 characters').max(5000),
    category: z.enum([
      'Ordering',
      'Payments',
      'Shipping & Delivery',
      'Returns & Refunds',
      'Account & Security',
      'Product & Inventory',
    ]),
    slug: z.string().optional(),
    order: z.number().int().optional().default(0),
    isPublished: z.boolean().optional().default(true),
  }),
});

export const updateFAQSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'FAQ ID is required'),
  }),
  body: z.object({
    question: z.string().min(5).max(300).optional(),
    answer: z.string().min(10).max(5000).optional(),
    category: z
      .enum([
        'Ordering',
        'Payments',
        'Shipping & Delivery',
        'Returns & Refunds',
        'Account & Security',
        'Product & Inventory',
      ])
      .optional(),
    slug: z.string().optional(),
    order: z.number().int().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const getFAQQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    isPublished: z.string().optional().transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
  }),
});
