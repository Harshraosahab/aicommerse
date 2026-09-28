import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addToCartSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'Invalid product ID format'),
  variantSku: z.string().trim().min(1).max(50).optional(),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Maximum quantity limit per item is 50')
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(50, 'Maximum quantity limit per item is 50'),
});

export const addToWishlistSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'Invalid product ID format'),
  variantSku: z.string().trim().min(1).max(50).optional(),
});

export const checkoutSummarySchema = z.object({
  addressId: z.string().regex(objectIdRegex, 'Invalid address ID format').optional(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;
export type CheckoutSummaryInput = z.infer<typeof checkoutSummarySchema>;
