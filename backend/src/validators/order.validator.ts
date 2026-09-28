import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const initiateOrderSchema = z.object({
  addressId: z.string().regex(objectIdRegex, 'Invalid address ID format'),
  paymentMethod: z.enum(['CARD', 'UPI', 'NETBANKING', 'COD'], {
    errorMap: () => ({ message: 'Payment method must be CARD, UPI, NETBANKING, or COD' }),
  }),
  billingAddressId: z.string().regex(objectIdRegex, 'Invalid billing address ID format').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().regex(objectIdRegex, 'Invalid order ID format'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters').max(300),
});

export const returnItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, 'Invalid product ID format'),
  variantSku: z.string().optional(),
  quantity: z.number().int().min(1, 'Return quantity must be at least 1'),
});

export const returnOrderSchema = z.object({
  reason: z.string().min(3, 'Return reason must be at least 3 characters').max(300),
  details: z.string().max(1000).optional(),
  items: z.array(returnItemSchema).min(1, 'At least one item must be selected for return'),
});

export const orderQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10) || 10)) : 10)),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURN_REQUESTED',
    'RETURNED',
    'REFUNDED',
  ]).optional(),
  paymentStatus: z.enum([
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ]).optional(),
});

export type InitiateOrderInput = z.infer<typeof initiateOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;