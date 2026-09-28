import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminAIInsightsPage } from '../pages/AdminAIInsightsPage';
import { aiApi } from '../services/aiApi';

vi.mock('../services/aiApi', () => ({
  aiApi: {
    getOverview: vi.fn(),
    getCustomerSegments: vi.fn(),
    getInventoryInsights: vi.fn(),
    analyzeProduct: vi.fn(),
    draftDescription: vi.fn(),
  },
}));

describe('AdminAIInsightsPage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(aiApi.getOverview).mockResolvedValue({
      success: true,
      data: {
        totalActiveProducts: 28,
        totalRecordedInteractions: 145,
        totalCustomerReviews: 50,
        unmoderatedReviewsCount: 3,
        aiFeaturesActive: [
          { name: 'Smart Search & Intent Parser', status: 'ONLINE', model: 'v1.0.0-nlp-extractor' },
        ],
      },
    });

    vi.mocked(aiApi.getCustomerSegments).mockResolvedValue({
      success: true,
      data: {
        totalCustomersAnalyzed: 12,
        insufficientData: false,
        segments: [
          {
            name: 'Champions',
            count: 4,
            percentage: 33.3,
            description: 'Top lifetime spenders',
            actionRecommendation: 'Offer VIP access',
            sampleUsers: [],
          },
        ],
      },
    });

    vi.mocked(aiApi.getInventoryInsights).mockResolvedValue({
      success: true,
      data: {
        totalProductsEvaluated: 28,
        insufficientData: false,
        stockoutAlerts: [
          {
            productId: 'p-1',
            name: 'Speed Runner Pro',
            currentStock: 4,
            unitsSold30d: 30,
            dailyVelocity: 1.0,
            daysOfInventoryRemaining: 4.0,
            riskLevel: 'CRITICAL',
            reason: 'High stockout risk in 4 days',
          },
        ],
        slowMovingAlerts: [],
        velocitySpikes: [],
      },
    });
  });

  it('renders overview telemetry cards and active AI services', async () => {
    render(<AdminAIInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('✨ AI Intelligence & Analytics Hub')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('145')).toBeInTheDocument();
      expect(screen.getByText('Smart Search & Intent Parser')).toBeInTheDocument();
    });
  });

  it('switches to customer RFM segments tab and renders segment distribution', async () => {
    render(<AdminAIInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Customer RFM Segments')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Customer RFM Segments'));

    await waitFor(() => {
      expect(screen.getByText('Champions')).toBeInTheDocument();
      expect(screen.getByText('4 (33.3%)')).toBeInTheDocument();
      expect(screen.getByText('Offer VIP access')).toBeInTheDocument();
    });
  });

  it('switches to inventory tab and displays stockout alerts', async () => {
    render(<AdminAIInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Inventory Velocity & Stockout Risk')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Inventory Velocity & Stockout Risk'));

    await waitFor(() => {
      expect(screen.getByText('🚨 Stockout Risk Alerts')).toBeInTheDocument();
      expect(screen.getByText('Speed Runner Pro')).toBeInTheDocument();
      expect(screen.getByText('4 in stock')).toBeInTheDocument();
    });
  });

  it('interacts with Product Catalog Copilot tool', async () => {
    vi.mocked(aiApi.analyzeProduct).mockResolvedValueOnce({
      success: true,
      data: {
        suggested_category: 'Footwear',
        suggested_subcategory: 'Running Shoes',
        suggested_tags: ['breathable', 'running'],
        suggested_highlights: ['Mesh upper'],
        confidence: 0.95,
        fallback: false,
      },
    });

    vi.mocked(aiApi.draftDescription).mockResolvedValueOnce({
      success: true,
      data: {
        title_suggestion: 'Speed Runner Pro Sneaker',
        short_description: 'High performance running sneaker.',
        full_description: 'Engineered for athletes with precision cushioning.',
        feature_bullet_points: ['Mesh upper', 'Responsive cushioning'],
        seo_keywords: ['running', 'shoes'],
        fallback: false,
      },
    });

    render(<AdminAIInsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Product Catalog AI Copilot')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Product Catalog AI Copilot'));

    const nameInput = screen.getByPlaceholderText(/e\.g\. Ergonomic Office Chair/i);
    fireEvent.change(nameInput, { target: { value: 'Speed Runner Pro' } });

    const genBtn = screen.getByRole('button', { name: /generate suggestions/i });
    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(screen.getByText(/Footwear > Running Shoes/i)).toBeInTheDocument();
      expect(screen.getByText('#breathable')).toBeInTheDocument();
      expect(screen.getByText('Engineered for athletes with precision cushioning.')).toBeInTheDocument();
    });
  });
});
