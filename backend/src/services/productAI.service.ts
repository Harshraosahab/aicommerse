import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class ProductAIService {
  /**
   * Evaluates product text, specs, and attributes to propose category and verified tags.
   */
  async analyzeProduct(data: {
    name: string;
    description?: string;
    brand?: string;
    specifications?: Array<{ name: string; value: string }>;
    attributes?: Array<{ name: string; value: string }>;
    existingTags?: string[];
  }) {
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/product/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || '',
          brand: data.brand || '',
          specifications: data.specifications || [],
          attributes: data.attributes || [],
          existing_tags: data.existingTags || [],
        }),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`AI service responded with HTTP ${response.status}`);
    } catch (err: any) {
      logger.warn(`AI Product analysis unavailable: ${err.message}. Returning baseline suggestions.`);
      return {
        suggested_category: 'General Catalog',
        suggested_subcategory: null,
        suggested_tags: data.existingTags || [],
        suggested_highlights: (data.specifications || []).slice(0, 3).map((s) => `${s.name}: ${s.value}`),
        confidence: 0.5,
        fallback: true,
      };
    }
  }

  /**
   * Generates grounded product description drafts based strictly on supplied attributes.
   */
  async draftDescription(data: {
    name: string;
    brand?: string;
    category?: string;
    specifications?: Array<{ name: string; value: string }>;
    attributes?: Array<{ name: string; value: string }>;
    tags?: string[];
  }) {
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/ai/product/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          brand: data.brand || '',
          category: data.category || '',
          specifications: data.specifications || [],
          attributes: data.attributes || [],
          tags: data.tags || [],
        }),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error(`AI service responded with HTTP ${response.status}`);
    } catch (err: any) {
      logger.warn(`AI Description generator unavailable: ${err.message}. Returning fallback draft.`);
      return {
        title_suggestion: `${data.brand ? data.brand + ' ' : ''}${data.name}`,
        short_description: `High-quality ${data.name} designed for everyday use.`,
        full_description: `${data.name} delivers reliable performance and craftsmanship. Built with verified specifications.`,
        feature_bullet_points: (data.specifications || []).map((s) => `${s.name}: ${s.value}`),
        seo_keywords: [data.name.toLowerCase()],
        fallback: true,
      };
    }
  }
}

export const productAIService = new ProductAIService();
