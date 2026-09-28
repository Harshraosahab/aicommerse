import { apiClient } from './apiClient';
import { IProduct } from './catalogApi';
import { getSessionToken } from './recommendationApi';

export interface SmartSearchResult {
  products: IProduct[];
  total: number;
  parsedIntent: {
    originalQuery: string;
    cleanedQuery: string;
    isNaturalLanguage: boolean;
    targetCategory?: string | null;
    targetBrand?: string | null;
    maxPrice?: number | null;
    minPrice?: number | null;
    minRating?: number | null;
    attributes: Record<string, string>;
  };
  appliedFilters: Record<string, any>;
  fallback: boolean;
  algorithm: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedActions: string[];
  toolResults: Array<{
    tool: string;
    data: any;
  }>;
  fallback: boolean;
}

export interface ReviewSummaryResponse {
  productId: string;
  totalReviewsAnalyzed: number;
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED' | 'INSUFFICIENT_DATA';
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  pros: string[];
  cons: string[];
  commonTopics: string[];
  insufficientData: boolean;
  insufficientDataReason?: string;
  fallback?: boolean;
}

export interface ProductAIAnalysis {
  suggested_category: string;
  suggested_subcategory?: string | null;
  suggested_tags: string[];
  suggested_highlights: string[];
  confidence: number;
  fallback: boolean;
}

export interface ProductDescriptionDraft {
  title_suggestion: string;
  short_description: string;
  full_description: string;
  feature_bullet_points: string[];
  seo_keywords: string[];
  fallback: boolean;
}

export interface CustomerSegment {
  name: string;
  count: number;
  percentage: number;
  description: string;
  actionRecommendation: string;
  sampleUsers: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
  }>;
}

export interface InventoryAnomaly {
  productId: string;
  name: string;
  sku?: string;
  currentStock: number;
  unitsSold30d: number;
  dailyVelocity: number;
  daysOfInventoryRemaining: number | null;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'SLOW_MOVING';
  reason: string;
}

export interface InventoryInsightsResponse {
  totalProductsEvaluated: number;
  insufficientData: boolean;
  insufficientDataReason?: string;
  stockoutAlerts: InventoryAnomaly[];
  slowMovingAlerts: InventoryAnomaly[];
  velocitySpikes: InventoryAnomaly[];
}

export interface AIOverviewResponse {
  totalActiveProducts: number;
  totalRecordedInteractions: number;
  totalCustomerReviews: number;
  unmoderatedReviewsCount: number;
  aiFeaturesActive: Array<{
    name: string;
    status: string;
    model: string;
  }>;
}

export const aiApi = {
  async smartSearch(params: {
    q: string;
    limit?: number;
    page?: number;
    sort?: string;
  }): Promise<{ success: boolean; data: SmartSearchResult }> {
    const sessionToken = getSessionToken();
    return apiClient.request<{ success: boolean; data: SmartSearchResult }>('ai/smart-search', {
      params: {
        ...params,
        sessionToken,
      },
    });
  },

  async assistantChat(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  ): Promise<{ success: boolean; data: AssistantChatResponse }> {
    const sessionToken = getSessionToken();
    return apiClient.request<{ success: boolean; data: AssistantChatResponse }>('ai/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory,
        sessionToken,
      }),
    });
  },

  async getReviewSummary(productId: string): Promise<{ success: boolean; data: ReviewSummaryResponse }> {
    return apiClient.request<{ success: boolean; data: ReviewSummaryResponse }>(
      `ai/reviews/${productId}/summary`
    );
  },

  async analyzeProduct(data: {
    name: string;
    description?: string;
    brand?: string;
    specifications?: Array<{ name: string; value: string }>;
    attributes?: Array<{ name: string; value: string }>;
    existingTags?: string[];
  }): Promise<{ success: boolean; data: ProductAIAnalysis }> {
    return apiClient.request<{ success: boolean; data: ProductAIAnalysis }>('admin/ai/product/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async draftDescription(data: {
    name: string;
    brand?: string;
    category?: string;
    specifications?: Array<{ name: string; value: string }>;
    attributes?: Array<{ name: string; value: string }>;
    tags?: string[];
  }): Promise<{ success: boolean; data: ProductDescriptionDraft }> {
    return apiClient.request<{ success: boolean; data: ProductDescriptionDraft }>('admin/ai/product/description', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOverview(): Promise<{ success: boolean; data: AIOverviewResponse }> {
    return apiClient.request<{ success: boolean; data: AIOverviewResponse }>('admin/ai/overview');
  },

  async getCustomerSegments(): Promise<{
    success: boolean;
    data: {
      totalCustomersAnalyzed: number;
      segments: CustomerSegment[];
      insufficientData: boolean;
      insufficientDataReason?: string;
    };
  }> {
    return apiClient.request('admin/ai/customers/segments');
  },

  async getInventoryInsights(): Promise<{ success: boolean; data: InventoryInsightsResponse }> {
    return apiClient.request<{ success: boolean; data: InventoryInsightsResponse }>('admin/ai/inventory/insights');
  },

  async getModerationQueue(limit: number = 25): Promise<{ success: boolean; data: any }> {
    return apiClient.request('admin/ai/reviews/moderation', {
      params: { limit },
    });
  },
};
