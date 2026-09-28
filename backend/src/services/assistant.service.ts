import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';
import { RecommendationService } from './recommendation.service.js';
import { SmartSearchService } from './smartSearch.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AssistantChatParams {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userId?: string | mongoose.Types.ObjectId;
  sessionToken?: string;
}

export interface AssistantChatResult {
  reply: string;
  suggestedActions: string[];
  toolResults: Array<{
    tool: string;
    data: any;
  }>;
  fallback: boolean;
}

const recommendationService = new RecommendationService();
const smartSearchService = new SmartSearchService();

export class AssistantService {
  /**
   * Processes user messages through the AI Assistant engine, defends against injection,
   * executes safe real database tools, and returns structured data and suggestions.
   */
  async chat(params: AssistantChatParams): Promise<AssistantChatResult> {
    const { message, conversationHistory = [], userId, sessionToken } = params;

    let aiResponse: any = null;
    let fallback = false;

    // 1. Invoke Python AI Microservice with 2000ms timeout guard
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
          session_token: sessionToken,
        }),
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        aiResponse = await response.json();
      } else {
        throw new Error(`AI service responded with HTTP ${response.status}`);
      }
    } catch (err: any) {
      logger.warn(`AI Shopping Assistant unavailable or timed out: ${err.message}. Engaging rule-based assistant fallback.`);
      fallback = true;
      aiResponse = this.getLocalAssistantFallback(message);
    }

    const reply = aiResponse.reply || "I'm here to help you find products, compare specs, or check your cart.";
    const suggestedActions = aiResponse.suggested_actions || ['Browse catalog', 'Check my cart', 'Top recommendations'];
    const toolCalls = aiResponse.tool_calls || [];

    // 2. Execute safe tools strictly scoped to authenticated user and real catalog
    const toolResults: Array<{ tool: string; data: any }> = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.tool_name;
      const args = toolCall.arguments || {};

      try {
        if (toolName === 'getUserCartSummary') {
          const cartSummary = await this.executeCartSummaryTool(userId);
          toolResults.push({ tool: 'getUserCartSummary', data: cartSummary });
        } else if (toolName === 'getRecommendations') {
          const limit = typeof args.limit === 'number' ? Math.min(args.limit, 8) : 4;
          const recs = await recommendationService.getPersonalizedRecommendations({
            userId,
            sessionToken,
            limit,
          });
          toolResults.push({ tool: 'getRecommendations', data: recs.recommendations.map(r => r.product) });
        } else if (toolName === 'compareProducts') {
          const compareData = await this.executeCompareProductsTool(args.query || message);
          toolResults.push({ tool: 'compareProducts', data: compareData });
        } else if (toolName === 'searchProducts') {
          const searchQuery = args.query || message;
          const searchResult = await smartSearchService.search({
            query: searchQuery,
            limit: 4,
          });
          toolResults.push({ tool: 'searchProducts', data: searchResult.products });
        }
      } catch (toolErr: any) {
        logger.error(`Failed to execute assistant tool ${toolName}: ${toolErr.message}`);
      }
    }

    return {
      reply,
      suggestedActions,
      toolResults,
      fallback,
    };
  }

  /**
   * Retrieves real cart summary strictly for the authenticated user session.
   */
  private async executeCartSummaryTool(userId?: string | mongoose.Types.ObjectId) {
    if (!userId) {
      return {
        hasUser: false,
        itemsCount: 0,
        subtotal: 0,
        items: [],
        message: 'Please sign in to view your shopping cart items.',
      };
    }

    const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(String(userId)) })
      .populate({
        path: 'items.product',
        select: 'name price images stock slug sku isPublished isActive',
      })
      .lean();

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        hasUser: true,
        itemsCount: 0,
        subtotal: 0,
        items: [],
        message: 'Your cart is currently empty.',
      };
    }

    const activeItems = cart.items.filter((item: any) => item.product && item.product.isActive !== false);
    const subtotal = activeItems.reduce((acc: number, item: any) => {
      const price = item.product?.price || item.priceAtAddition || 0;
      return acc + price * item.quantity;
    }, 0);

    return {
      hasUser: true,
      itemsCount: activeItems.reduce((acc: number, item: any) => acc + item.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      currency: 'INR',
      items: activeItems.map((item: any) => ({
        productId: item.product._id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        quantity: item.quantity,
        lineTotal: Number(((item.product.price || 0) * item.quantity).toFixed(2)),
        image: item.product.images?.[0]?.url || item.product.images?.[0] || null,
      })),
    };
  }

  /**
   * Performs side-by-side spec comparison for real products matching comparison query terms.
   */
  private async executeCompareProductsTool(query: string) {
    // Extract tokens from query
    const tokens = query
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    let products: any[] = [];

    if (tokens.length > 0) {
      products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: tokens.join('|'), $options: 'i' } },
          { tags: { $in: tokens.map((t) => new RegExp(t, 'i')) } },
        ],
      })
        .select('name slug price rating reviewCount specifications attributes images stock brand category')
        .populate('brand', 'name')
        .populate('category', 'name')
        .limit(3)
        .lean();
    }

    if (products.length === 0) {
      products = await Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(2)
        .select('name slug price rating reviewCount specifications attributes images stock brand category')
        .populate('brand', 'name')
        .populate('category', 'name')
        .lean();
    }

    return {
      products: products.map((p) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        rating: p.rating,
        reviewCount: p.reviewCount,
        brand: (p.brand as any)?.name || 'General',
        category: (p.category as any)?.name || 'General',
        stock: p.stock,
        image: p.images?.[0]?.url || p.images?.[0] || null,
        specifications: p.specifications || [],
        attributes: p.attributes || [],
      })),
    };
  }

  /**
   * Resilient local fallback when Python AI microservice is temporarily unavailable.
   */
  private getLocalAssistantFallback(message: string) {
    const msgLower = message.toLowerCase();

    if (
      msgLower.includes('ignore') ||
      msgLower.includes('system') ||
      msgLower.includes('admin') ||
      msgLower.includes('password')
    ) {
      return {
        reply: 'I am your shopping assistant and can help you browse products, compare items, and inspect your cart.',
        suggested_actions: ['Browse products', 'Check my cart'],
        tool_calls: [],
      };
    }

    if (msgLower.includes('cart')) {
      return {
        reply: 'Checking your active shopping cart items...',
        suggested_actions: ['Go to checkout', 'Continue shopping'],
        tool_calls: [{ tool_name: 'getUserCartSummary', arguments: {} }],
      };
    }

    if (msgLower.includes('recommend') || msgLower.includes('suggest')) {
      return {
        reply: 'Here are top recommendations based on trending customer interest:',
        suggested_actions: ['View more', 'Browse categories'],
        tool_calls: [{ tool_name: 'getRecommendations', arguments: { limit: 4 } }],
      };
    }

    if (msgLower.includes('compare') || msgLower.includes('vs') || msgLower.includes('versus')) {
      return {
        reply: 'Here is a comparison of specifications and pricing for the requested items:',
        suggested_actions: ['View details', 'Add to cart'],
        tool_calls: [{ tool_name: 'compareProducts', arguments: { query: message } }],
      };
    }

    return {
      reply: `Here are matching products from our catalog for "${message}":`,
      suggested_actions: ['Filter by price', 'Top rated'],
      tool_calls: [{ tool_name: 'searchProducts', arguments: { query: message } }],
    };
  }
}

export const assistantService = new AssistantService();
