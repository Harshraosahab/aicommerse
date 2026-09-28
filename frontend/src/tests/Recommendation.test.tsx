import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationSection } from '../components/recommendations/RecommendationSection';
import { recommendationApi } from '../services/recommendationApi';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { adminApi } from '../services/adminApi';

vi.mock('../services/recommendationApi', () => ({
  recommendationApi: {
    getPersonalized: vi.fn(),
    getSimilar: vi.fn(),
    getTrending: vi.fn(),
    trackInteraction: vi.fn().mockResolvedValue({ success: true, data: {} }),
    getAnalytics: vi.fn(),
  },
  getSessionToken: vi.fn(() => 'mock-session-token'),
}));

vi.mock('../services/adminApi', () => ({
  adminApi: {
    getMetrics: vi.fn(),
    getSalesAnalytics: vi.fn(),
  },
}));

describe('Phase 8: Frontend Recommendation UI & Telemetry Tests', () => {
  const mockProduct = {
    _id: 'prod-rec-1',
    name: 'Wireless Noise Cancelling Headphones',
    slug: 'wireless-noise-cancelling-headphones',
    description: 'High-end audio headphones with deep bass',
    price: 199.99,
    discount: 0,
    stock: 12,
    SKU: 'HEAD-001',
    tags: ['audio', 'wireless'],
    images: [{ url: 'https://example.com/headphones.jpg', isPrimary: true }],
    category: { _id: 'cat-1', name: 'Audio', slug: 'audio', isActive: true },
    isActive: true,
    isFeatured: false,
    isBestseller: true,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 42,
    specifications: [],
    attributes: [],
    variants: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner and then personalized recommendations with reason tags', async () => {
    vi.mocked(recommendationApi.getPersonalized).mockResolvedValueOnce({
      success: true,
      data: {
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.94,
            reason: 'Matches your interest in Audio',
            algorithm: 'hybrid_interaction_profile',
            isColdStart: false,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'hybrid_interaction_profile',
        modelVersion: 'v1.0.0-hybrid',
        coldStart: false,
        fallback: false,
      },
    });

    render(
      <MemoryRouter>
        <RecommendationSection
          title="Recommended For You"
          type="personalized"
          limit={4}
        />
      </MemoryRouter>
    );

    // Verify recommendations display
    await waitFor(() => {
      expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    });

    expect(screen.getByText('Wireless Noise Cancelling Headphones')).toBeInTheDocument();
    expect(screen.getByText(/Matches your interest in Audio/)).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getByText('⚡ AI Powered')).toBeInTheDocument();

    // Verify VIEW telemetry was invoked
    expect(recommendationApi.trackInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'VIEW',
        productId: 'prod-rec-1',
      })
    );
  });

  it('renders cold-start indicator when new visitor has 0 interaction history', async () => {
    vi.mocked(recommendationApi.getPersonalized).mockResolvedValueOnce({
      success: true,
      data: {
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.85,
            reason: 'Trending now (popular among shoppers)',
            algorithm: 'cold_start_trending',
            isColdStart: true,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'cold_start_trending',
        modelVersion: 'v1.0.0-fallback',
        coldStart: true,
        fallback: false,
      },
    });

    render(
      <MemoryRouter>
        <RecommendationSection
          title="Recommended For You"
          type="personalized"
          limit={4}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('🔥 Trending Picks')).toBeInTheDocument();
    });
  });

  it('tracks CLICK telemetry when user interacts with a recommended product card', async () => {
    vi.mocked(recommendationApi.getSimilar).mockResolvedValueOnce({
      success: true,
      data: {
        recommendations: [
          {
            product: mockProduct as any,
            score: 0.88,
            reason: 'Same category and brand',
            algorithm: 'multi_feature_content_similarity',
            isColdStart: false,
            fallback: false,
          },
        ],
        total: 1,
        algorithm: 'multi_feature_content_similarity',
        modelVersion: 'v1.0.0-hybrid',
        coldStart: false,
        fallback: false,
      },
    });

    render(
      <MemoryRouter>
        <RecommendationSection
          title="AI Similar Products"
          type="similar"
          productId="prod-rec-1"
          limit={4}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Similar Products')).toBeInTheDocument();
    });

    const card = screen.getByText('Wireless Noise Cancelling Headphones');
    fireEvent.click(card);

    expect(recommendationApi.trackInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CLICK',
        productId: 'prod-rec-1',
      })
    );
  });

  it('renders AI Recommendation Engine Telemetry on Admin Dashboard', async () => {
    vi.mocked(adminApi.getMetrics).mockResolvedValueOnce({
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
        recentOrders: [],
      } as any,
    });

    vi.mocked(adminApi.getSalesAnalytics).mockResolvedValueOnce({
      success: true,
      data: [{ date: '2026-03-01', revenue: 1000, orders: 4 }],
    });

    vi.mocked(recommendationApi.getAnalytics).mockResolvedValueOnce({
      success: true,
      data: {
        period: '30d',
        totalInteractions: 240,
        actionCounts: {
          VIEW: 150,
          CLICK: 45,
          SEARCH: 15,
          ADD_TO_CART: 20,
          REMOVE_FROM_CART: 2,
          WISHLIST: 5,
          PURCHASE: 3,
        },
        telemetry: {
          recommendationImpressions: 100,
          recommendationClicks: 22,
          clickThroughRatePercent: 22.0,
        },
        aiEngine: {
          status: 'online',
          modelVersion: 'v1.0.0-hybrid',
          serviceUrl: 'http://localhost:8000',
          algorithms: ['user_interaction_affinity', 'content_multi_feature_similarity'],
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AI Recommendation Engine Telemetry')).toBeInTheDocument();
    });

    expect(screen.getByText('22%')).toBeInTheDocument();
    expect(screen.getByText('Engine: ONLINE')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0-hybrid')).toBeInTheDocument();
  });
});
