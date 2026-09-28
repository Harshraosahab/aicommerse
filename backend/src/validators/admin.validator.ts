import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, 'Must be a valid 24-character hexadecimal ObjectId');

// 1. Dashboard Query
export const dashboardPeriodSchema = z.object({
  period: z.enum(['today', 'yesterday', '7d', '30d', 'this_month', 'last_month', 'this_year', 'all']).default('30d'),
  interval: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

// 2. Pagination & Search Base Query
export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  status: z.string().trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// 3. Product Management
export const productAttributeSchema = z.object({
  name: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const productVariantSchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1).toUpperCase(),
  price: z.number().min(0),
  stock: z.number().int().min(0).default(0),
  attributes: z.array(productAttributeSchema).default([]),
});

export const productImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  alt: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-safe kebab-case').optional(),
  description: z.string().trim().min(10),
  shortDescription: z.string().trim().max(500).optional(),
  brand: objectIdSchema.optional(),
  category: objectIdSchema,
  subcategory: objectIdSchema.optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  SKU: z.string().trim().min(2).toUpperCase(),
  tags: z.array(z.string().trim()).default([]),
  images: z.array(productImageSchema).default([]),
  specifications: z.array(productAttributeSchema).default([]),
  attributes: z.array(productAttributeSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

// 4. Inventory Adjustment
export const adjustStockSchema = z.object({
  productId: objectIdSchema,
  variantSku: z.string().trim().toUpperCase().optional(),
  adjustment: z.number().int().refine((val) => val !== 0, 'Adjustment cannot be zero'),
  reason: z.string().trim().min(3, 'Adjustment reason must be at least 3 characters long'),
});

// 5. Order Management
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
  comment: z.string().trim().optional(),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().url().optional(),
});

export const adminCancelOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Cancellation reason is required'),
});

// 6. Returns & Refunds
export const returnDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().trim().min(3, 'Reason is required'),
});

export const processRefundSchema = z.object({
  amount: z.number().positive('Refund amount must be greater than zero'),
  reason: z.string().trim().min(3, 'Refund reason is required'),
});

// 7. Users
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum([
    'USER',
    'ADMIN',
    'SUPER_ADMIN',
    'PRODUCT_MANAGER',
    'ORDER_MANAGER',
    'SUPPORT_MANAGER',
    'MARKETING_MANAGER',
    'MODERATOR',
  ]),
});

// 8. Categories & Brands
export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().max(1000).optional(),
  image: z.string().trim().optional(),
  parentCategory: objectIdSchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().trim().max(1000).optional(),
  logo: z.string().trim().optional(),
  website: z.string().trim().url().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

// 9. Coupons
const couponBaseSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive('Coupon value must be positive'),
  minimumOrderValue: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().optional(),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  applicableProducts: z.array(objectIdSchema).default([]),
  applicableCategories: z.array(objectIdSchema).default([]),
  isActive: z.boolean().default(true),
});

export const createCouponSchema = couponBaseSchema.refine(
  (data) => data.expiryDate > data.startDate,
  {
    message: 'Expiry date must be after start date',
    path: ['expiryDate'],
  }
);

export const updateCouponSchema = couponBaseSchema.partial();

// 10. Reviews Moderation
export const moderateReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'DELETE']),
  reason: z.string().trim().optional(),
});

// 11. Support Tickets
export const ticketResponseSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: objectIdSchema.nullable().optional(),
});

// 12. Banners
export const createBannerSchema = z.object({
  title: z.string().trim().min(2).max(150),
  image: z.string().trim().url('Must be a valid image URL'),
  link: z.string().trim().default('/'),
  placement: z.enum(['HERO', 'SIDEBAR', 'POPUP', 'FOOTER']).default('HERO'),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export const updateBannerSchema = createBannerSchema.partial();
