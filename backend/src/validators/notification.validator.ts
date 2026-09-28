import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 15)),
    isRead: z.string().optional().transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),
    type: z.string().optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Notification ID is required'),
  }),
});

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters').max(150),
    message: z.string().min(5, 'Message must be at least 5 characters').max(1000),
    type: z.enum(['PROMOTION', 'COUPON', 'FLASH_SALE', 'SYSTEM']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    actionUrl: z.string().optional(),
    targetRole: z.string().optional(),
  }),
});
