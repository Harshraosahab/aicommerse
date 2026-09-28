import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersPage } from '../pages/OrdersPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { OrderSuccessPage } from '../pages/OrderSuccessPage';
import { PaymentFailurePage } from '../pages/PaymentFailurePage';
import { orderApi, Order } from '../services/orderApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

vi.mock('../services/orderApi', () => ({
  orderApi: {
    getMyOrders: vi.fn(),
    getOrderDetails: vi.fn(),
    cancelOrder: vi.fn(),
    requestReturn: vi.fn(),
    getInvoice: vi.fn(),
    initiateOrder: vi.fn(),
    verifyPayment: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(),
}));

describe('Phase 6: Order, Payment & Returns Frontend Tests', () => {
  const mockOrder: Order = {
    _id: '60d5ec49f1b2c8b1f8e4e1a1',
    orderNumber: 'ORD-20260909-TEST01',
    user: 'user-123',
    items: [
      {
        product: 'prod-101',
        name: 'Wireless Noise-Cancelling Headphones',
        sku: 'WNC-01',
        price: 4999,
        quantity: 1,
        lineTotal: 4999,
        image: 'https://example.com/headphones.jpg',
      },
    ],
    shippingAddress: {
      name: 'John Doe',
      phone: '9876543210',
      street: '42 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
    },
    subtotal: 4999,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    totalAmount: 4999,
    currency: 'INR',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
    orderStatus: 'CONFIRMED',
    statusHistory: [
      {
        status: 'CONFIRMED',
        timestamp: new Date().toISOString(),
        comment: 'Order confirmed',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', name: 'John Doe', email: 'john@example.com', role: 'USER' } as any,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(useCart).mockReturnValue({
      cart: null,
      wishlist: null,
      cartCount: 0,
      wishlistCount: 0,
      isLoading: false,
      error: null,
      refreshCart: vi.fn(),
      refreshWishlist: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      clearWishlist: vi.fn(),
      moveWishlistToCart: vi.fn(),
      moveCartToWishlist: vi.fn(),
    });
  });

  describe('OrdersPage (Order History)', () => {
    it('renders empty state when user has zero orders', async () => {
      vi.mocked(orderApi.getMyOrders).mockResolvedValueOnce({
        success: true,
        data: {
          orders: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        },
      });

      render(
        <BrowserRouter>
          <OrdersPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No orders yet')).toBeInTheDocument();
      });
      expect(screen.getByText('Start Shopping')).toBeInTheDocument();
    });

    it('renders order cards with order numbers and status badges', async () => {
      vi.mocked(orderApi.getMyOrders).mockResolvedValueOnce({
        success: true,
        data: {
          orders: [mockOrder],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      });

      render(
        <BrowserRouter>
          <OrdersPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ORD-20260909-TEST01')).toBeInTheDocument();
      });

      expect(screen.getByText('Wireless Noise-Cancelling Headphones')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
      expect(screen.getByText('PAID')).toBeInTheDocument();
      expect(screen.getByText('View Details →')).toBeInTheDocument();
    });
  });

  describe('OrderDetailPage', () => {
    it('renders order details, timeline, and item snapshot', async () => {
      vi.mocked(orderApi.getOrderDetails).mockResolvedValueOnce({
        success: true,
        data: { order: mockOrder },
      });

      render(
        <MemoryRouter initialEntries={['/orders/60d5ec49f1b2c8b1f8e4e1a1']}>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Order ORD-20260909-TEST01')).toBeInTheDocument();
      });

      expect(screen.getByText('42 MG Road')).toBeInTheDocument();
      expect(screen.getByText('Cancel Order')).toBeInTheDocument();
      expect(screen.getByText('📄 View Invoice')).toBeInTheDocument();
    });

    it('opens cancellation modal when clicking Cancel Order button', async () => {
      vi.mocked(orderApi.getOrderDetails).mockResolvedValueOnce({
        success: true,
        data: { order: mockOrder },
      });

      render(
        <MemoryRouter initialEntries={['/orders/60d5ec49f1b2c8b1f8e4e1a1']}>
          <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Order')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel Order'));
      expect(screen.getByPlaceholderText('Reason for cancellation...')).toBeInTheDocument();
      expect(screen.getByText('Confirm Cancellation')).toBeInTheDocument();
    });
  });

  describe('OrderSuccessPage', () => {
    it('renders confirmation checkmark and confirmed order number', async () => {
      vi.mocked(orderApi.getOrderDetails).mockResolvedValueOnce({
        success: true,
        data: { order: mockOrder },
      });

      render(
        <MemoryRouter initialEntries={['/order-success/60d5ec49f1b2c8b1f8e4e1a1']}>
          <Routes>
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Thank You for Your Order!')).toBeInTheDocument();
      });

      expect(screen.getByText('ORD-20260909-TEST01')).toBeInTheDocument();
      expect(screen.getByText('View Order Details & Timeline')).toBeInTheDocument();
    });
  });

  describe('PaymentFailurePage', () => {
    it('renders failure notification with retry and cart buttons', () => {
      render(
        <BrowserRouter>
          <PaymentFailurePage />
        </BrowserRouter>
      );

      expect(screen.getByText('Payment Incomplete')).toBeInTheDocument();
      expect(screen.getByText('Return to Checkout & Retry')).toBeInTheDocument();
      expect(screen.getByText('View Cart')).toBeInTheDocument();
    });
  });
});
