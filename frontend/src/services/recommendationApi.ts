import { apiClient } from './apiClient';
import { IProduct } from './catalogApi';

export type InteractionAction =
  | 'VIEW'
  | 'SEARCH'
  | 'CLICK'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'WISHLIST'
  | 'PURCHASE';

export interface ScoredProduct {
  product: IProduct;
  score: number;
  reason: string;
  matchFactors?: Record<string, number>;
  algorithm: string;
  isColdStart?: boolean;
  fallback?: boolean;
}

export interface RecommendationResponseData {
  recommendations: ScoredProduct[];
  total: number;
  algorithm: string;
  modelVersion: string;
  coldStart: boolean;
  fallback: boolean;
}

export interface RecommendationAnalytics {
  period: string;
  totalInteractions: number;
  actionCounts: Record<string, number>;
  telemetry: {
    recommendationImpressions: number;
    recommendationClicks: number;
    clickThroughRatePercent: number;
  };
  aiEngine: {
    status: string;
    modelVersion: string;
    serviceUrl: string;
    algorithms: string[];
  };
}

export interface TrackInteractionPayload {
  action: InteractionAction;
  productId?: string;
  sessionToken?: string;
  metadata?: Record<string, any>;
}

export function getSessionToken(): string {
  try {
    const key = 'nexus_session_token';
    let token = localStorage.getItem(key);
    if (!token) {
      token = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(key, token);
    }
    return token;
  } catch {
    return 'sess_fallback_' + Date.now();
  }
}

export const recommendationApi = {
  async getPersonalized(limit: number = 8): Promise<{ success: boolean; data: RecommendationResponseData }> {
    const sessionToken = getSessionToken();
    return apiClient.request<{ success: boolean; data: RecommendationResponseData }>(
      'recommendations/personalized',
      {
        params: { limit, sessionToken },
      }
    );
  },

  async getSimilar(
    productId: string,
    limit: number = 8
  ): Promise<{ success: boolean; data: RecommendationResponseData }> {
    return apiClient.request<{ success: boolean; data: RecommendationResponseData }>(
      `recommendations/product/${productId}`,
      {
        params: { limit },
      }
    );
  },

  async getTrending(
    limit: number = 8,
    period: string = '30d'
  ): Promise<{ success: boolean; data: RecommendationResponseData }> {
    return apiClient.request<{ success: boolean; data: RecommendationResponseData }>(
      'recommendations/trending',
      {
        params: { limit, period },
      }
    );
  },

  async trackInteraction(payload: TrackInteractionPayload): Promise<{ success: boolean; data: any }> {
    const sessionToken = payload.sessionToken || getSessionToken();
    return apiClient.request<{ success: boolean; data: any }>('interactions', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        sessionToken,
      }),
    });
  },

  async getAnalytics(period: string = '30d'): Promise<{ success: boolean; data: RecommendationAnalytics }> {
    return apiClient.request<{ success: boolean; data: RecommendationAnalytics }>(
      'admin/dashboard/recommendations-analytics',
      {
        params: { period },
      }
    );
  },
};
