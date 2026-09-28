import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsPage } from '../pages/NotificationsPage';
import { NotificationPreferencesPage } from '../pages/NotificationPreferencesPage';
import { SupportPage } from '../pages/SupportPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';
import { FAQDetailPage } from '../pages/FAQDetailPage';
import { notificationApi } from '../services/notificationApi';
import { supportApi } from '../services/supportApi';
import { faqApi } from '../services/faqApi';

vi.mock('../services/notificationApi', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    clearRead: vi.fn(),
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

vi.mock('../services/supportApi', () => ({
  supportApi: {
    createTicket: vi.fn(),
    getMyTickets: vi.fn(),
    getTicketById: vi.fn(),
    addReply: vi.fn(),
    closeTicket: vi.fn(),
  },
}));

vi.mock('../services/faqApi', () => ({
  faqApi: {
    getPublishedFAQs: vi.fn(),
    getFAQBySlug: vi.fn(),
    adminGetAllFAQs: vi.fn(),
    adminCreateFAQ: vi.fn(),
    adminUpdateFAQ: vi.fn(),
    adminDeleteFAQ: vi.fn(),
    adminSeedFAQs: vi.fn(),
  },
}));

describe('Phase 10 Frontend Tests: Notifications, Support & Help Center', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Notifications Center Page', () => {
    it('renders notifications list with items and marks an item as read', async () => {
      vi.mocked(notificationApi.getNotifications).mockResolvedValue({
        notifications: [
          {
            _id: 'notif-1',
            type: 'ORDER_PLACED',
            title: 'Order Confirmed: #ORD-1234',
            message: 'Your order has been confirmed successfully.',
            priority: 'HIGH',
            channel: 'IN_APP',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        unreadCount: 1,
        page: 1,
        pages: 1,
      });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        _id: 'notif-1',
        isRead: true,
      } as any);

      render(
        <MemoryRouter initialEntries={['/notifications']}>
          <Routes>
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/Loading notifications.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Order Confirmed: #ORD-1234')).toBeInTheDocument();
        expect(screen.getByText('Your order has been confirmed successfully.')).toBeInTheDocument();
      });

      const markReadBtn = screen.getByText('Mark as read');
      fireEvent.click(markReadBtn);

      await waitFor(() => {
        expect(notificationApi.markAsRead).toHaveBeenCalledWith('notif-1');
      });
    });
  });

  describe('2. Notification Preferences Page', () => {
    it('loads and displays preference toggles and handles save', async () => {
      vi.mocked(notificationApi.getPreferences).mockResolvedValue({
        email: { orderUpdates: true, promotional: false },
        inApp: { orderUpdates: true, promotional: true },
      });

      vi.mocked(notificationApi.updatePreferences).mockResolvedValue({
        email: { orderUpdates: true, promotional: true },
        inApp: { orderUpdates: true, promotional: true },
      });

      render(
        <MemoryRouter initialEntries={['/notifications/preferences']}>
          <Routes>
            <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
        expect(screen.getByText('Order Confirmation & Status Updates')).toBeInTheDocument();
      });

      const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(notificationApi.updatePreferences).toHaveBeenCalled();
      });
    });
  });

  describe('3. Customer Support Tickets Page', () => {
    it('renders customer tickets list with status and navigation', async () => {
      vi.mocked(supportApi.getMyTickets).mockResolvedValue({
        tickets: [
          {
            _id: 'tkt-1',
            ticketNumber: 'TKT-20260916-ABC123',
            subject: 'Delivery delayed beyond estimated window',
            category: 'DELIVERY',
            message: 'My order has not arrived yet.',
            status: 'OPEN',
            priority: 'HIGH',
            responses: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      });

      render(
        <MemoryRouter initialEntries={['/support']}>
          <Routes>
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Delivery delayed beyond estimated window')).toBeInTheDocument();
      });
      expect(screen.getByText(/TKT-20260916-ABC123/)).toBeInTheDocument();
      expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    });
  });

  describe('4. Help Center & FAQs Page', () => {
    it('displays categories and accordion FAQs', async () => {
      vi.mocked(faqApi.getPublishedFAQs).mockResolvedValue([
        {
          _id: 'faq-1',
          question: 'How do I track my shipment?',
          answer: 'You can track your package from the Orders tab.',
          category: 'Shipping & Delivery',
          slug: 'how-do-i-track-my-shipment',
          order: 1,
          isPublished: true,
          createdAt: new Date().toISOString(),
        },
      ]);

      render(
        <MemoryRouter initialEntries={['/help']}>
          <Routes>
            <Route path="/help" element={<HelpCenterPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Help Center & FAQs')).toBeInTheDocument();
        expect(screen.getByText('How do I track my shipment?')).toBeInTheDocument();
      });

      // Expand accordion
      const questionEl = screen.getByText('How do I track my shipment?');
      fireEvent.click(questionEl);

      await waitFor(() => {
        expect(screen.getByText('You can track your package from the Orders tab.')).toBeInTheDocument();
      });
    });

    it('renders single FAQ detail page with JSON-LD schema', async () => {
      vi.mocked(faqApi.getFAQBySlug).mockResolvedValue({
        _id: 'faq-1',
        question: 'What is your refund timeline?',
        answer: 'Refunds take 3 to 5 business days to post to your bank.',
        category: 'Returns & Refunds',
        slug: 'refund-timeline',
        order: 1,
        isPublished: true,
        createdAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter initialEntries={['/help/refund-timeline']}>
          <Routes>
            <Route path="/help/:slug" element={<FAQDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('What is your refund timeline?')).toBeInTheDocument();
        expect(screen.getByText(/Refunds take 3 to 5 business days/i)).toBeInTheDocument();
      });
    });
  });
});
