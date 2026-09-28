import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewSummaryCard } from '../components/reviews/ReviewSummaryCard';
import { aiApi } from '../services/aiApi';

vi.mock('../services/aiApi', () => ({
  aiApi: {
    getReviewSummary: vi.fn(),
  },
}));

describe('ReviewSummaryCard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('honestly displays insufficient data notice when reviews < 3', async () => {
    vi.mocked(aiApi.getReviewSummary).mockResolvedValueOnce({
      success: true,
      data: {
        productId: 'prod-1',
        totalReviewsAnalyzed: 1,
        overallSentiment: 'INSUFFICIENT_DATA',
        averageRating: 5,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        pros: [],
        cons: [],
        commonTopics: [],
        insufficientData: true,
        insufficientDataReason: 'At least 3 customer reviews are required to generate an authentic AI review summary.',
      },
    });

    render(<ReviewSummaryCard productId="prod-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('insufficient-reviews-banner')).toBeInTheDocument();
      expect(screen.getByText(/At least 3 customer reviews are required/i)).toBeInTheDocument();
    });
  });

  it('renders aspect praises, considerations, and sentiment when data is sufficient', async () => {
    vi.mocked(aiApi.getReviewSummary).mockResolvedValueOnce({
      success: true,
      data: {
        productId: 'prod-1',
        totalReviewsAnalyzed: 5,
        overallSentiment: 'POSITIVE',
        averageRating: 4.8,
        sentimentDistribution: { positive: 5, neutral: 0, negative: 0 },
        pros: ['Long battery life', 'Crystal clear mic'],
        cons: ['Slightly tight fit'],
        commonTopics: ['battery', 'comfort'],
        insufficientData: false,
      },
    });

    render(<ReviewSummaryCard productId="prod-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('ai-review-summary')).toBeInTheDocument();
      expect(screen.getByText(/POSITIVE SENTIMENT/i)).toBeInTheDocument();
      expect(screen.getByText('Long battery life')).toBeInTheDocument();
      expect(screen.getByText('Slightly tight fit')).toBeInTheDocument();
      expect(screen.getByText('#battery')).toBeInTheDocument();
    });
  });
});
