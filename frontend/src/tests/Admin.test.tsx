import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminProductsPage } from '../pages/AdminProductsPage';
import { AdminInventoryPage } from '../pages/AdminInventoryPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { AdminReturnsRefundsPage } from '../pages/AdminReturnsRefundsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { AdminSettingsPage } from '../pages/AdminSettingsPage';
import { adminApi } from '../services/adminApi';
import { useAuth } from '../context/AuthContext';

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getMetrics: vi.fn(),
    getSalesAnalytics: vi.fn(),
    getTopProducts: vi.fn(),
    getCategoryPerformance: vi.fn(),
    getAbandonedCarts: vi.fn(),
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getCategories: vi.fn(),
    getBrands: vi.fn(),
    getInventory: vi.fn(),
    adjustStock: vi.fn(),
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    updateOrderStatus: vi.fn(),
    cancelOrder: vi.fn(),
    getReturns: vi.fn(),
    decideReturn: vi.fn(),
    getRefunds: vi.fn(),
    processRefund: vi.fn(),
    getUsers: vi.fn(),
    getUserById: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserRole: vi.fn(),
    getReviews: vi.fn(),
    moderateReview: vi.fn(),
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
    getTickets: vi.fn(),
    getAuditLogs: vi.fn(),
    getSettings: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Phase 7: Admin Panel Frontend Tests', () => {
  const mockAdminUser = {
    _id: 'admin-001',
    name: 'Chief Administrator',
    email: 'admin@ecommerce.local',
    role: 'SUPER_ADMIN' as const,
    isActive: true,
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    addresses: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it('renders AdminLayout with navigation links and active admin user profile', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Chief Administrator')).toBeInTheDocument();
    expect(screen.getByText('SUPER_ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Back to Store')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Products').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Inventory').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Orders').length).toBeGreaterThan(0);
  });

  it('renders AdminDashboardPage with real KPI metrics and charts', async () => {
    (adminApi.getMetrics as any).mockResolvedValue({
      success: true,
      data: {
        period: '30d',
        dateRange: { startDate: '2026-08-16', endDate: '2026-09-16' },
        users: { total: 85, active: 80, new: 15 },
        products: { total: 40, active: 38, lowStock: 4, outOfStock: 2 },
        orders: {
          total: 120,
          pending: 10,
          confirmed: 20,
          processing: 30,
          shipped: 25,
          delivered: 30,
          cancelled: 5,
          returnRequested: 1,
          returned: 1,
        },
        financials: {
          netRevenue: 250000,
          grossRevenue: 255000,
          refundedAmount: 5000,
          paidOrdersCount: 115,
          averageOrderValue: 2083,
        },
        payments: { paid: 115, pending: 5, failed: 2, refunded: 1 },
        abandonedCarts: 3,
        recentOrders: [
          {
            _id: 'ord-123456',
            orderNumber: 'ORD-2026-101',
            createdAt: '2026-09-15T12:00:00Z',
            totalAmount: 4999,
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            shippingAddress: { name: 'Alice Buyer' },
          },
        ],
      },
    });

    (adminApi.getSalesAnalytics as any).mockResolvedValue({
      success: true,
      data: [
        { date: '2026-09-01', revenue: 12000, orders: 5 },
        { date: '2026-09-02', revenue: 18000, orders: 8 },
      ],
    });

    (adminApi.getTopProducts as any).mockResolvedValue({
      success: true,
      data: [
        { _id: 'p1', title: 'Ergonomic Chair', totalSold: 42, totalRevenue: 84000 },
      ],
    });

    (adminApi.getCategoryPerformance as any).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Executive Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Net Revenue')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/115 paid orders/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/30 delivered/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/80 active accounts/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText(/low stock/i).length).toBeGreaterThan(0);
    });

    // Check recent orders
    expect(screen.getByText('ORD-2026-101')).toBeInTheDocument();
  });

  it('renders AdminProductsPage with product list and search controls', async () => {
    (adminApi.getProducts as any).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'prod-001',
          name: 'Mechanical Keyboard',
          slug: 'mechanical-keyboard',
          sku: 'MK-BLUE-01',
          price: 3499,
          stock: 25,
          isActive: true,
          category: { name: 'Electronics' },
          brand: { name: 'TechGear' },
        },
      ],
      meta: { total: 1, totalPages: 1 },
    });

    (adminApi.getCategories as any).mockResolvedValue({ success: true, data: [] });
    (adminApi.getBrands as any).mockResolvedValue({ success: true, data: [] });

    render(
      <MemoryRouter>
        <AdminProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
      expect(screen.getByText('MK-BLUE-01')).toBeInTheDocument();
      expect(screen.getByText('₹3,499')).toBeInTheDocument();
    });
  });

  it('renders AdminInventoryPage and handles stock adjustments', async () => {
    (adminApi.getInventory as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'prod-001',
          productId: 'prod-001',
          name: 'Mechanical Keyboard',
          sku: 'MK-BLUE-01',
          price: 3499,
          stock: 3,
          lowStockThreshold: 5,
          stockStatus: 'LOW_STOCK',
        },
      ],
      meta: { total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminInventoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
      expect(screen.getAllByText(/Low Stock/i).length).toBeGreaterThan(0);
    });

    // Open Adjust Stock modal
    const adjustBtn = screen.getByText('Adjust');
    fireEvent.click(adjustBtn);

    expect(screen.getByText(/Adjust Stock Quantity/i)).toBeInTheDocument();
  });

  it('renders AdminOrdersPage with orders list and filter tabs', async () => {
    (adminApi.getOrders as any).mockResolvedValue({
      success: true,
      data: [
        {
          _id: '60d5ec49f1b2c8b1f8e4e1a1',
          orderNumber: 'ORD-2026-999',
          orderStatus: 'PENDING',
          paymentStatus: 'COMPLETED',
          totalAmount: 7999,
          createdAt: '2026-09-15T10:00:00Z',
          user: { email: 'alice@example.com' },
          shippingAddress: { name: 'Alice Smith' },
          items: [{ name: 'Monitor Arm', quantity: 1, price: 7999 }],
        },
      ],
      meta: { total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-999')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('₹7,999')).toBeInTheDocument();
    });
  });

  it('renders AdminReturnsRefundsPage with return requests review', async () => {
    (adminApi.getReturns as any).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'ret-101',
          orderId: '60d5ec49f1b2c8b1f8e4e1a1',
          orderNumber: 'ORD-2026-888',
          customerEmail: 'carol@test.com',
          reason: 'Defective screen',
          status: 'REQUESTED',
          refundAmount: 5499,
          createdAt: '2026-09-14T09:00:00Z',
        },
      ],
      meta: { total: 1, totalPages: 1 },
    });

    (adminApi.getRefunds as any).mockResolvedValue({
      success: true,
      data: [],
      meta: { total: 0, totalPages: 0 },
    });

    render(
      <MemoryRouter>
        <AdminReturnsRefundsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-2026-888')).toBeInTheDocument();
      expect(screen.getByText('Defective screen')).toBeInTheDocument();
      expect(screen.getAllByText('carol@test.com').length).toBeGreaterThan(0);
      expect(screen.getByText('REQUESTED')).toBeInTheDocument();
    });
  });

  it('renders AdminUsersPage and displays accounts with role tags', async () => {
    (adminApi.getUsers as any).mockResolvedValue({
      success: true,
      data: [
        {
          _id: 'usr-111',
          name: 'Bob Customer',
          email: 'bob@example.com',
          role: 'USER',
          isActive: true,
          createdAt: '2026-08-01T00:00:00Z',
        },
        {
          _id: 'usr-222',
          name: 'Dave Support',
          email: 'dave@admin.com',
          role: 'SUPPORT_MANAGER',
          isActive: true,
          createdAt: '2026-08-01T00:00:00Z',
        },
      ],
      meta: { total: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bob Customer')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
      expect(screen.getByText('Dave Support')).toBeInTheDocument();
      expect(screen.getByText('SUPPORT_MANAGER')).toBeInTheDocument();
    });
  });

  it('renders AdminSettingsPage guaranteeing zero secret exposure', async () => {
    (adminApi.getSettings as any).mockResolvedValue({
      success: true,
      data: {
        environment: {
          nodeEnv: 'test',
          port: 5000,
          corsOrigin: 'http://localhost:5173',
          databaseMasked: '[CONFIGURED]',
        },
        payments: {
          razorpayKeyId: 'rzp_test_12345678',
          razorpaySecretMasked: '[CONFIGURED]',
        },
        commerce: {
          currency: 'INR (₹)',
          taxRate: 18,
          freeShippingThreshold: 999,
          standardShippingFee: 49,
          returnWindowDays: 7,
        },
        email: {
          host: 'smtp.ethereal.email',
          from: 'noreply@ecommerce.local',
          port: 587,
          passwordMasked: '[CONFIGURED]',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Zero Secret Exposure Guarantee/i)).toBeInTheDocument();
      expect(screen.getByText('INR (₹)')).toBeInTheDocument();
      expect(screen.getByText('18% (GST)')).toBeInTheDocument();
      expect(screen.getAllByText('[CONFIGURED]').length).toBeGreaterThan(0);
    });
  });
});
