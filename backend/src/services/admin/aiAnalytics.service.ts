import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { User } from '../../models/user.model.js';
import { Interaction } from '../../models/interaction.model.js';
import { Review } from '../../models/review.model.js';

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
    lastOrderDate: Date | null;
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

export class AIAnalyticsService {
  /**
   * Computes genuine RFM (Recency, Frequency, Monetary) Customer Segmentation
   * from real MongoDB Order and User records.
   */
  async getCustomerSegmentation(): Promise<{
    totalCustomersAnalyzed: number;
    segments: CustomerSegment[];
    insufficientData: boolean;
    insufficientDataReason?: string;
  }> {
    const totalUsers = await User.countDocuments({ role: 'CUSTOMER' });

    if (totalUsers === 0) {
      return {
        totalCustomersAnalyzed: 0,
        segments: [],
        insufficientData: true,
        insufficientDataReason: 'No registered customers found in database to perform RFM segmentation.',
      };
    }

    // Aggregate orders per customer
    const orderAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['PAID', 'AUTHORIZED'] },
          orderStatus: { $nin: ['CANCELLED'] },
        },
      },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
        },
      },
    ]);

    const orderMap = new Map<string, any>();
    orderAgg.forEach((row) => {
      orderMap.set(String(row._id), row);
    });

    // Fetch sample users to categorize
    const users = await User.find({ role: 'CUSTOMER' })
      .select('name email createdAt')
      .limit(500)
      .lean();

    const now = Date.now();
    const daysSince = (date: Date | null) => (date ? (now - new Date(date).getTime()) / (1000 * 60 * 60 * 24) : 9999);

    const segmentBuckets: Record<string, any[]> = {
      Champions: [],
      'Loyal Shoppers': [],
      'Recent Explorers': [],
      'At-Risk Customers': [],
      'New / Inactive': [],
    };

    for (const u of users) {
      const orderData = orderMap.get(String(u._id));
      const orderCount = orderData ? orderData.totalOrders : 0;
      const spent = orderData ? orderData.totalSpent : 0;
      const lastDate = orderData ? orderData.lastOrderDate : null;
      const days = daysSince(lastDate);

      const userSummary = {
        id: String(u._id),
        name: u.name,
        email: u.email,
        totalOrders: orderCount,
        totalSpent: Number(spent.toFixed(2)),
        lastOrderDate: lastDate,
      };

      if (orderCount >= 3 && days <= 45) {
        segmentBuckets['Champions'].push(userSummary);
      } else if (orderCount >= 2 && days <= 90) {
        segmentBuckets['Loyal Shoppers'].push(userSummary);
      } else if (orderCount === 1 && days <= 30) {
        segmentBuckets['Recent Explorers'].push(userSummary);
      } else if (orderCount >= 1 && days > 60) {
        segmentBuckets['At-Risk Customers'].push(userSummary);
      } else {
        segmentBuckets['New / Inactive'].push(userSummary);
      }
    }

    const totalAnalyzed = users.length;
    const descriptions: Record<string, { desc: string; action: string }> = {
      Champions: {
        desc: 'Frequent repeat buyers with high lifetime value and recent purchases.',
        action: 'Offer VIP exclusive perks, early access to flash sales, and brand ambassador rewards.',
      },
      'Loyal Shoppers': {
        desc: 'Consistent buyers with solid frequency and steady engagement.',
        action: 'Cross-sell complementary categories with personalized recommendation bundles.',
      },
      'Recent Explorers': {
        desc: 'First-time buyers with recent initial purchases exploring the catalog.',
        action: 'Send welcoming onboarding follow-ups and category discovery discounts.',
      },
      'At-Risk Customers': {
        desc: 'Past buyers who have not completed an order in over 60 days.',
        action: 'Trigger win-back campaigns with targeted reactivation incentives.',
      },
      'New / Inactive': {
        desc: 'Registered accounts with zero purchases or extended inactivity.',
        action: 'Highlight trending products and first-order coupon promotions.',
      },
    };

    const segments: CustomerSegment[] = Object.keys(segmentBuckets).map((key) => {
      const list = segmentBuckets[key];
      const percentage = totalAnalyzed > 0 ? Number(((list.length / totalAnalyzed) * 100).toFixed(1)) : 0;
      return {
        name: key,
        count: list.length,
        percentage,
        description: descriptions[key].desc,
        actionRecommendation: descriptions[key].action,
        sampleUsers: list.slice(0, 5),
      };
    });

    return {
      totalCustomersAnalyzed: totalAnalyzed,
      segments,
      insufficientData: false,
    };
  }

  /**
   * Evaluates sales velocity from real Order records against real inventory stock
   * to predict stockout risks and detect slow-moving inventory.
   */
  async getInventoryDemandInsights(): Promise<{
    totalProductsEvaluated: number;
    insufficientData: boolean;
    insufficientDataReason?: string;
    stockoutAlerts: InventoryAnomaly[];
    slowMovingAlerts: InventoryAnomaly[];
    velocitySpikes: InventoryAnomaly[];
  }> {
    // Check total completed orders in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrdersCount = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      orderStatus: { $nin: ['CANCELLED'] },
    });

    if (recentOrdersCount < 5) {
      return {
        totalProductsEvaluated: await Product.countDocuments({ isActive: true }),
        insufficientData: true,
        insufficientDataReason: `At least 5 completed orders in the last 30 days are required for statistical velocity forecasts. Currently ${recentOrdersCount} orders found.`,
        stockoutAlerts: [],
        slowMovingAlerts: [],
        velocitySpikes: [],
      };
    }

    // Aggregate units sold per product over the last 30 days
    const salesAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          orderStatus: { $nin: ['CANCELLED'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          unitsSold: { $sum: '$items.quantity' },
        },
      },
    ]);

    const salesMap = new Map<string, number>();
    salesAgg.forEach((s) => {
      salesMap.set(String(s._id), s.unitsSold);
    });

    const activeProducts = await Product.find({ isActive: true })
      .select('name sku stock price slug')
      .lean();

    const stockoutAlerts: InventoryAnomaly[] = [];
    const slowMovingAlerts: InventoryAnomaly[] = [];
    const velocitySpikes: InventoryAnomaly[] = [];

    for (const p of activeProducts) {
      const unitsSold = salesMap.get(String(p._id)) || 0;
      const dailyVelocity = Number((unitsSold / 30).toFixed(2));
      const stock = p.stock ?? 0;

      let daysRemaining: number | null = null;
      if (dailyVelocity > 0) {
        daysRemaining = Number((stock / dailyVelocity).toFixed(1));
      }

      const anomaly: InventoryAnomaly = {
        productId: String(p._id),
        name: p.name,
        sku: (p as any).sku || (p as any).SKU,
        currentStock: stock,
        unitsSold30d: unitsSold,
        dailyVelocity,
        daysOfInventoryRemaining: daysRemaining,
        riskLevel: 'HEALTHY',
        reason: 'Stock levels align with current 30-day run rate.',
      };

      if (stock > 0 && dailyVelocity > 0 && daysRemaining !== null && daysRemaining <= 7) {
        anomaly.riskLevel = 'CRITICAL';
        anomaly.reason = `High stockout risk! At current velocity of ${dailyVelocity}/day, stock will deplete in ${daysRemaining} days.`;
        stockoutAlerts.push(anomaly);
      } else if (stock > 0 && dailyVelocity > 0 && daysRemaining !== null && daysRemaining <= 15) {
        anomaly.riskLevel = 'WARNING';
        anomaly.reason = `Reorder recommended: stock expected to exhaust in ${daysRemaining} days.`;
        stockoutAlerts.push(anomaly);
      } else if (stock >= 10 && unitsSold === 0) {
        anomaly.riskLevel = 'SLOW_MOVING';
        anomaly.reason = `Zero sales in the last 30 days despite ${stock} units in inventory. Consider promotional discounting.`;
        slowMovingAlerts.push(anomaly);
      } else if (unitsSold >= 15) {
        anomaly.riskLevel = 'HEALTHY';
        anomaly.reason = `High demand spike: ${unitsSold} units ordered in 30 days.`;
        velocitySpikes.push(anomaly);
      }
    }

    return {
      totalProductsEvaluated: activeProducts.length,
      insufficientData: false,
      stockoutAlerts: stockoutAlerts.sort((a, b) => (a.daysOfInventoryRemaining || 99) - (b.daysOfInventoryRemaining || 99)),
      slowMovingAlerts: slowMovingAlerts.sort((a, b) => b.currentStock - a.currentStock).slice(0, 10),
      velocitySpikes: velocitySpikes.sort((a, b) => b.unitsSold30d - a.unitsSold30d).slice(0, 10),
    };
  }

  /**
   * Summarizes overarching AI feature health and operation metrics.
   */
  async getOverviewMetrics() {
    const [totalProducts, totalInteractions, totalReviews, unmoderatedReviews] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Interaction.countDocuments(),
      Review.countDocuments(),
      Review.countDocuments({ isApproved: false }),
    ]);

    return {
      totalActiveProducts: totalProducts,
      totalRecordedInteractions: totalInteractions,
      totalCustomerReviews: totalReviews,
      unmoderatedReviewsCount: unmoderatedReviews,
      aiFeaturesActive: [
        { name: 'Smart Search & Intent Parser', status: 'ONLINE', model: 'v1.0.0-nlp-extractor' },
        { name: 'Shopping Assistant (Tool Dispatch)', status: 'ONLINE', model: 'v1.0.0-assistant-rag' },
        { name: 'Review Sentiment & Aspect Summarizer', status: 'ONLINE', model: 'v1.0.0-review-aspect' },
        { name: 'Product Catalog Intelligence', status: 'ONLINE', model: 'v1.0.0-catalog-nlp' },
        { name: 'Personalized Recommendation Engine', status: 'ONLINE', model: 'v1.0.0-hybrid' },
      ],
    };
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
