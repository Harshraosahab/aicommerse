import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  inStock: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  isFeatured: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  isNewArrival: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  isBestseller: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  sort: z
    .enum(['price_asc', 'price_desc', 'newest', 'rating', 'reviews', 'discount'])
    .default('newest'),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().min(5),
  shortDescription: z.string().trim().max(500).optional(),
  brand: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional(),
      })
    )
    .default([]),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  SKU: z.string().trim().toUpperCase(),
  tags: z.array(z.string().trim()).default([]),
  specifications: z
    .array(
      z.object({
        name: z.string().trim(),
        value: z.string().trim(),
      })
    )
    .default([]),
  attributes: z
    .array(
      z.object({
        name: z.string().trim(),
        value: z.string().trim(),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        name: z.string().trim(),
        sku: z.string().trim().toUpperCase(),
        price: z.number().min(0),
        stock: z.number().int().min(0).default(0),
        attributes: z.array(
          z.object({
            name: z.string().trim(),
            value: z.string().trim(),
          })
        ),
      })
    )
    .default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().max(1000).optional(),
  image: z.string().url().optional(),
  parentCategory: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().max(1000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();
