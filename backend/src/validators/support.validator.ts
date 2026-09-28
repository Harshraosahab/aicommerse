import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
    category: z.enum([
      'ORDER',
      'PAYMENT',
      'DELIVERY',
      'RETURN',
      'REFUND',
      'PRODUCT',
      'ACCOUNT',
      'TECHNICAL',
      'OTHER',
    ]),
    message: z.string().min(10, 'Message must be at least 10 characters').max(3000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    relatedOrder: z.string().optional(),
    relatedProduct: z.string().optional(),
  }),
});

export const getTicketsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 10)),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
    category: z.string().optional(),
  }),
});

export const ticketParamSchema = z.object({
  params: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
  }),
});

export const addReplySchema = z.object({
  params: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
  }),
  body: z.object({
    message: z.string().min(1, 'Reply message cannot be empty').max(3000),
    attachments: z.array(z.string().url('Attachment must be a valid URL')).optional().default([]),
  }),
});
