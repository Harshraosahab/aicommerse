import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const trackInteractionSchema = z.object({
  action: z.enum(
    [
      'VIEW',
      'SEARCH',
      'CLICK',
      'ADD_TO_CART',
      'REMOVE_FROM_CART',
      'WISHLIST',
      'PURCHASE',
    ],
    {
      required_error: 'Action is required',
    }
  ),
  productId: z
    .string()
    .regex(objectIdRegex, 'productId must be a valid 24-character hexadecimal ObjectId')
    .optional(),
  sessionToken: z.string().trim().min(1).max(256).optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type TrackInteractionInput = z.infer<typeof trackInteractionSchema>;
