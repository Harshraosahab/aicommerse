import { Product, IProduct } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { Brand } from '../models/brand.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

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

export class SmartSearchService {
  /**
   * Executes AI-Powered Smart Search with natural language query parsing,
   * attribute extraction, dynamic MongoDB filtering, and transparent hybrid ranking.
   */
  async search(params: {
    query: string;
    limit?: number;
    page?: number;
    sort?: string;
  }): Promise<SmartSearchResult> {
    const { query, limit = 20, page = 1, sort = 'relevance' } = params;

    // Load active category and brand names to guide AI entity resolution
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true }).select('name slug').lean(),
      Brand.find({ isActive: true }).select('name slug').lean(),
    ]);

    const knownCategories = categories.map((c: any) => c.name);
    const knownBrands = brands.map((b: any) => b.name);

    let parsed: any = null;
    let fallback = false;

    // 1. Call Python AI Natural Language Query Parser with 1500ms timeout
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/search/parse-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          known_categories: knownCategories,
          known_brands: knownBrands,
        }),
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) {
        parsed = await response.json();
      }
    } catch (err: any) {
      logger.warn(`AI Smart Search parser unavailable or timed out: ${err.message}. Engaging standard keyword fallback.`);
      fallback = true;
    }

    // Default intent if AI service failed or timed out
    if (!parsed) {
      parsed = {
        original_query: query,
        cleaned_query: query,
        target_category: null,
        target_brand: null,
        max_price: null,
        min_price: null,
        min_rating: null,
        attributes: {},
        is_natural_language: false,
      };
      fallback = true;
    }

    // 2. Build Dynamic MongoDB Query from Parsed Intent
    const filter: Record<string, any> = { isActive: true };
    const appliedFilters: Record<string, any> = {};

    // Price Bounds
    if (parsed.max_price !== null || parsed.min_price !== null) {
      filter.price = {};
      if (parsed.min_price !== null) {
        filter.price.$gte = parsed.min_price;
        appliedFilters.minPrice = parsed.min_price;
      }
      if (parsed.max_price !== null) {
        filter.price.$lte = parsed.max_price;
        appliedFilters.maxPrice = parsed.max_price;
      }
    }

    // Rating Bounds
    if (parsed.min_rating !== null) {
      filter.rating = { $gte: parsed.min_rating };
      appliedFilters.minRating = parsed.min_rating;
    }

    // Category Resolution
    if (parsed.target_category) {
      const matchedCat = categories.find(
        (c: any) =>
          c.slug.toLowerCase() === parsed.target_category.toLowerCase() ||
          c.name.toLowerCase().includes(parsed.target_category.toLowerCase())
      );
      if (matchedCat) {
        filter.category = matchedCat._id;
        appliedFilters.category = matchedCat.name;
      }
    }

    // Brand Resolution
    if (parsed.target_brand) {
      const matchedBrand = brands.find(
        (b: any) =>
          b.slug.toLowerCase() === parsed.target_brand.toLowerCase() ||
          b.name.toLowerCase().includes(parsed.target_brand.toLowerCase())
      );
      if (matchedBrand) {
        filter.brand = matchedBrand._id;
        appliedFilters.brand = matchedBrand.name;
      }
    }

    // Attributes (e.g. color, use-case)
    if (parsed.attributes && Object.keys(parsed.attributes).length > 0) {
      appliedFilters.attributes = parsed.attributes;
    }

    // Keyword Text Match using cleaned query
    const searchTokens = (parsed.cleaned_query || query)
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 1);

    if (searchTokens.length > 0) {
      const regexPatterns = searchTokens.map((token: string) => {
        const sanitized = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(sanitized, 'i');
      });

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } },
          { description: { $in: regexPatterns } },
        ],
      });
    }

    // 3. Execute MongoDB Query with Sorting
    let sortOptions: any = {};
    if (sort === 'price_asc') sortOptions = { price: 1 };
    else if (sort === 'price_desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'newest') sortOptions = { createdAt: -1 };
    else sortOptions = { isBestseller: -1, rating: -1, reviewCount: -1 }; // Hybrid relevance prior

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products: products as unknown as IProduct[],
      total,
      parsedIntent: {
        originalQuery: parsed.original_query,
        cleanedQuery: parsed.cleaned_query,
        isNaturalLanguage: parsed.is_natural_language,
        targetCategory: parsed.target_category,
        targetBrand: parsed.target_brand,
        maxPrice: parsed.max_price,
        minPrice: parsed.min_price,
        minRating: parsed.min_rating,
        attributes: parsed.attributes || {},
      },
      appliedFilters,
      fallback,
      algorithm: fallback ? 'keyword_text_regex' : 'hybrid_nlp_attribute_filtering',
    };
  }
}

export const smartSearchService = new SmartSearchService();
