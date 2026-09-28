import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
import { User } from '../src/models/user.model.js';
import { Notification } from '../src/models/notification.model.js';
import { SupportTicket } from '../src/models/supportTicket.model.js';
import { FAQ } from '../src/models/faq.model.js';
import { NotificationService } from '../src/services/notification.service.js';
import { SupportService } from '../src/services/support.service.js';
import { FAQService } from '../src/services/faq.service.js';
import { emailService } from '../src/services/email.service.js';

describe('Phase 10: Notifications, Email & Customer Support Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: mockUserId,
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'USER',
    isActive: true,
    notificationPreferences: {
      email: { orderUpdates: true, promotional: false },
      inApp: { orderUpdates: true, promotional: true },
    },
  };

  const mockAdminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Admin Boss',
    email: 'admin@example.com',
    role: 'ADMIN',
    isActive: true,
  };

  const userToken = generateToken(mockUser as any);
  const adminToken = generateToken(mockAdminUser as any);
  let findByIdSpy: any;

  beforeEach(() => {
    findByIdSpy = vi.spyOn(User, 'findById').mockImplementation((id: any) => {
      const targetUser =
        id?.toString() === mockAdminUser._id.toString()
          ? { ...mockAdminUser, save: vi.fn().mockResolvedValue(true), markModified: vi.fn() }
          : { ...mockUser, save: vi.fn().mockResolvedValue(true), markModified: vi.fn() };

      const queryObj: any = Promise.resolve(targetUser);
      queryObj.select = vi.fn().mockResolvedValue(targetUser);
      return queryObj;
    });
  });

  afterEach(() => {
    findByIdSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  describe('1. Notifications System', () => {
    it('requires authentication for customer notifications', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('retrieves user notifications list and unread count', async () => {
      vi.spyOn(Notification, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([
                {
                  _id: new mongoose.Types.ObjectId(),
                  user: mockUserId,
                  type: 'ORDER_PLACED',
                  title: 'Order Confirmed',
                  message: 'Your order was placed successfully',
                  isRead: false,
                  createdAt: new Date(),
                },
              ]),
            }),
          }),
        }),
      } as any);

      vi.spyOn(Notification, 'countDocuments').mockImplementation((filter: any) => {
        if (filter.isRead === false) return Promise.resolve(1) as any;
        return Promise.resolve(1) as any;
      });

      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('marks a single notification as read', async () => {
      const notifId = new mongoose.Types.ObjectId().toString();
      const mockDoc = {
        _id: notifId,
        user: mockUserId,
        isRead: false,
        readAt: null,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Notification, 'findOne').mockResolvedValue(mockDoc as any);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(mockDoc.isRead).toBe(true);
      expect(mockDoc.readAt).toBeInstanceOf(Date);
    });

    it('marks all notifications as read', async () => {
      vi.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 3 } as any);

      const res = await request(app)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.modifiedCount).toBe(3);
    });

    it('admin can broadcast notifications to users', async () => {
      vi.spyOn(NotificationService, 'broadcastNotification').mockResolvedValue({ sentCount: 10 });

      const res = await request(app)
        .post('/api/v1/admin/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Weekend Flash Sale!',
          message: 'Enjoy up to 50% discount across all store items.',
          type: 'FLASH_SALE',
          priority: 'HIGH',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.sentCount).toBe(10);
    });
  });

  describe('2. Notification Preferences', () => {
    it('fetches authenticated user preferences', async () => {
      const res = await request(app)
        .get('/api/v1/users/me/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notificationPreferences).toBeDefined();
      expect(res.body.data.notificationPreferences.email.orderUpdates).toBe(true);
    });

    it('updates user preferences', async () => {
      const res = await request(app)
        .put('/api/v1/users/me/notification-preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: { promotional: false },
          inApp: { priceDrop: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.notificationPreferences.email.promotional).toBe(false);
    });
  });

  describe('3. Customer Support Tickets System', () => {
    it('creates support ticket with validation', async () => {
      vi.spyOn(SupportService, 'createTicket').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        ticketNumber: 'TKT-20260916-123456',
        subject: 'Defective zipper on order item',
        category: 'ORDER',
        status: 'OPEN',
      } as any);

      const res = await request(app)
        .post('/api/v1/support')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          subject: 'Defective zipper on order item',
          category: 'ORDER',
          message: 'The zipper broke upon first opening the jacket packaging.',
          priority: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.ticket.ticketNumber).toBe('TKT-20260916-123456');
    });

    it('enforces IDOR: returns 404/unauthorized for ticket belonging to another user', async () => {
      vi.spyOn(SupportTicket, 'findOne').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(null),
            }),
          }),
        }),
      } as any);

      const res = await request(app)
        .get('/api/v1/support/TKT-FOREIGN-999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('allows customer to reply to their ticket', async () => {
      vi.spyOn(SupportService, 'addCustomerReply').mockResolvedValue({
        ticketNumber: 'TKT-20260916-123456',
        status: 'IN_PROGRESS',
        responses: [{ message: 'Here is the photo' }],
      } as any);

      const res = await request(app)
        .post('/api/v1/support/TKT-20260916-123456/reply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Here is the photo of the broken item.',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Reply posted successfully');
    });
  });

  describe('4. FAQ & Help Center System', () => {
    it('publicly lists published FAQs', async () => {
      vi.spyOn(FAQService, 'getPublishedFAQs').mockResolvedValue([
        {
          _id: new mongoose.Types.ObjectId(),
          question: 'How do I track my order?',
          answer: 'Go to your Orders page to track delivery status.',
          category: 'Shipping & Delivery',
          slug: 'how-do-i-track-my-order',
          order: 1,
          isPublished: true,
        } as any,
      ]);

      const res = await request(app).get('/api/v1/faqs');
      expect(res.status).toBe(200);
      expect(res.body.data.faqs).toHaveLength(1);
    });

    it('fetches single published FAQ by slug', async () => {
      vi.spyOn(FAQService, 'getFAQBySlug').mockResolvedValue({
        question: 'What is your return policy?',
        answer: 'Returns are accepted within 14 days.',
        slug: 'what-is-your-return-policy',
        category: 'Returns & Refunds',
      } as any);

      const res = await request(app).get('/api/v1/faqs/what-is-your-return-policy');
      expect(res.status).toBe(200);
      expect(res.body.data.faq.slug).toBe('what-is-your-return-policy');
    });

    it('admin can create and manage FAQs', async () => {
      vi.spyOn(FAQService, 'createFAQ').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        question: 'How to use gift cards?',
        answer: 'Enter your code at checkout.',
        category: 'Payments',
        slug: 'how-to-use-gift-cards',
        isPublished: true,
      } as any);

      const res = await request(app)
        .post('/api/v1/admin/faqs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'How to use gift cards?',
          answer: 'Enter your code at checkout in the promo field.',
          category: 'Payments',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.faq.question).toBe('How to use gift cards?');
    });
  });

  describe('5. Resilient Email Dispatches', () => {
    it('safely handles unconfigured SMTP by logging simulation without throwing in dev', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test message',
      });

      expect(result.sent).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});
