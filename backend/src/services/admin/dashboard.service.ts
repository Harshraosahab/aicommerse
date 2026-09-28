import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import { Cart } from '../../models/cart.model.js';
import { Interaction } from '../../models/interaction.model.js';
import { env } from '../../config/env.js';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(period: string = '30d'): DateRange {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  switch (period) {
    case 'today':
      startDate.setUTCHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      startDate.setUTCDate(startDate.getUTCDate() - 1);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCDate(endDate.getUTCDate() - 1);
      endDate.setUTCHours(23, 59, 59, 999);
      break;
    case '7d':
      startDate.setUTCDate(startDate.getUTCDate() - 7);
      break;
    case '30d':
      startDate.setUTCDate(startDate.getUTCDate() - 30);
      break;
    case 'this_month':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
    case 'last_month':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      endDate.setTime(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)).getTime());
      break;
    case 'this_year':
      startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;
    case 'all':
      startDate = new Date(0);
      break;
    default:
      startDate.setUTCDate(startDate.getUTCDate() - 30);
  }

  return { startDate, endDate };
}

export class DashboardService {
  /**
   * Aggregate real KPIs across collections based on the selected date period.
   * Real database calculations only. Zero hardcoded counters.
   */
  async getMetrics(period: string = '30d') {
    const { startDate, endDate } = getDateRange(period);
    const dateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

    // Parallel aggregations for performance
    const [
      userStats,
      productStats,
      orderStats,
      revenueStats,
      paymentStats,
      recentOrders,
      abandonedCartsCount,
    ] = await Promise.all([
      // 1. User Stats
      User.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { isActive: true } }, { $count: 'count' }],
            newInPeriod: [{ $match: dateMatch }, { $count: 'count' }],
          },
        },
      ]),

      // 2. Product & Inventory Stats
      Product.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [{ $match: { isActive: true } }, { $count: 'count' }],
            outOfStock: [{ $match: { stock: { $lte: 0 } } }, { $count: 'count' }],
            lowStock: [{ $match: { stock: { $gt: 0, $lte: 10 } } }, { $count: 'count' }],
          },
        },
      ]),

      // 3. Order Breakdown Stats in period
      Order.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Financial & Revenue Stats in period (Paid orders, excluding cancelled)
      Order.aggregate([
        {
          $match: {
            ...dateMatch,
            paymentStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED'] },
            status: { $ne: 'CANCELLED' },
          },
        },
        {
          $group: {
            _id: null,
            grossRevenue: { $sum: '$totalAmount' },
            refunds: { $sum: { $ifNull: ['$refund.amount', 0] } },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]),

      // 5. Payment Status Counts in period
      Order.aggregate([
        { $match: dateMatch },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // 6. Recent 5 Orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber totalAmount status paymentStatus createdAt shippingAddress.name')
        .lean(),

      // 7. Abandoned Carts count (items > 0, not updated in 2 hours)
      Cart.countDocuments({
        'items.0': { $exists: true },
        updatedAt: { $lte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      }),
    ]);

    // Process User Stats
    const totalUsers = userStats[0]?.total[0]?.count || 0;
    const activeUsers = userStats[0]?.active[0]?.count || 0;
    const newUsers = userStats[0]?.newInPeriod[0]?.count || 0;

    // Process Product Stats
    const totalProducts = productStats[0]?.total[0]?.count || 0;
    const activeProducts = productStats[0]?.active[0]?.count || 0;
    const outOfStockProducts = productStats[0]?.outOfStock[0]?.count || 0;
    const lowStockProducts = productStats[0]?.lowStock[0]?.count || 0;

    // Process Order Status map
    const orderStatusMap: Record<string, number> = {};
    let totalPeriodOrders = 0;
    for (const item of orderStats) {
      orderStatusMap[item._id] = item.count;
      totalPeriodOrders += item.count;
    }

    // Process Revenue Stats
    const gross = revenueStats[0]?.grossRevenue || 0;
    const refundTotal = revenueStats[0]?.refunds || 0;
    const netRevenue = Math.max(0, Math.round((gross - refundTotal) * 100) / 100);
    const avgOrderValue = revenueStats[0]?.avgOrderValue
      ? Math.round(revenueStats[0].avgOrderValue * 100) / 100
      : 0;

    // Process Payment Status map
    const paymentStatusMap: Record<string, number> = {};
    for (const item of paymentStats) {
      paymentStatusMap[item._id] = item.count;
    }

    return {
      period,
      dateRange: { startDate, endDate },
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      orders: {
        total: totalPeriodOrders,
        pending: orderStatusMap['PENDING'] || 0,
        confirmed: orderStatusMap['CONFIRMED'] || 0,
        processing: orderStatusMap['PROCESSING'] || 0,
        shipped: orderStatusMap['SHIPPED'] || 0,
        delivered: orderStatusMap['DELIVERED'] || 0,
        cancelled: orderStatusMap['CANCELLED'] || 0,
        returnRequested: orderStatusMap['RETURN_REQUESTED'] || 0,
        returned: orderStatusMap['RETURNED'] || 0,
      },
      financials: {
        netRevenue,
        grossRevenue: Math.round(gross * 100) / 100,
        refundedAmount: Math.round(refundTotal * 100) / 100,
        paidOrdersCount: revenueStats[0]?.orderCount || 0,
        averageOrderValue: avgOrderValue,
      },
      payments: {
        paid: paymentStatusMap['PAID'] || 0,
        pending: paymentStatusMap['PENDING'] || 0,
        failed: paymentStatusMap['FAILED'] || 0,
        refunded: paymentStatusMap['REFUNDED'] || 0,
      },
      abandonedCarts: abandonedCartsCount,
      recentOrders,
    };
  }

  /**
   * Real Sales Velocity & Order Trends over time.
   * Groups records dynamically by day, week, or month.
   */
  async getSalesAnalytics(period: string = '30d') {
    const { startDate, endDate } = getDateRange(period);

    // Format grouping date string in Mongo aggregation
    const dateFormat = period === 'today' || period === 'yesterday'
      ? '%Y-%m-%d %H:00'
      : '%Y-%m-%d';

    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED'] },
          status: { $ne: 'CANCELLED' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trends.map((t) => ({
      date: t._id,
      revenue: Math.round(t.revenue * 100) / 100,
      orders: t.orders,
    }));
  }

  /**
   * Top 5 selling products by quantity and revenue.
   */
  async getTopProducts(limit: number = 5) {
    const results = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED'] },
          status: { $ne: 'CANCELLED' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          sku: { $first: '$items.sku' },
          totalUnits: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { totalUnits: -1 } },
      { $limit: limit },
    ]);

    return results.map((r) => ({
      productId: r._id,
      name: r.name,
      image: r.image,
      sku: r.sku,
      totalUnits: r.totalUnits,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
    }));
  }

  /**
   * Sales grouped by Category.
   */
  async getSalesByCategory() {
    const results = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['PAID', 'PARTIALLY_REFUNDED'] },
          status: { $ne: 'CANCELLED' },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: '$productDoc' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryDoc._id',
          categoryName: { $first: { $ifNull: ['$categoryDoc.name', 'Uncategorized'] } },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    return results.map((c) => ({
      categoryId: c._id,
      name: c.categoryName,
      unitsSold: c.unitsSold,
      revenue: Math.round(c.revenue * 100) / 100,
    }));
  }

  /**
   * Real Abandoned Carts list.
   */
  async getAbandonedCarts(page: number = 1, limit: number = 20) {
    const cutoffDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const skip = (page - 1) * limit;

    const [carts, total] = await Promise.all([
      Cart.find({
        'items.0': { $exists: true },
        updatedAt: { $lte: cutoffDate },
      })
        .populate('user', 'name email phone')
        .populate('items.product', 'name price images SKU')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cart.countDocuments({
        'items.0': { $exists: true },
        updatedAt: { $lte: cutoffDate },
      }),
    ]);

    return {
      carts: carts.map((c: any) => ({
        id: c._id,
        user: c.user,
        itemsCount: c.items?.length || 0,
        items: c.items,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Real AI recommendation telemetry and engine diagnostics.
   * Aggregates interaction types, computes recommendation CTR with 0 division safety,
   * and queries Python AI microservice model health.
   */
  async getRecommendationAnalytics(period: string = '30d') {
    const { startDate, endDate } = getDateRange(period);
    const dateMatch = { timestamp: { $gte: startDate, $lte: endDate } };

    const [interactionsByAction, recommendationTelemetry] = await Promise.all([
      Interaction.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      Interaction.aggregate([
        {
          $match: {
            ...dateMatch,
            'metadata.source': 'recommendations',
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const actionCounts: Record<string, number> = {
      VIEW: 0,
      CLICK: 0,
      SEARCH: 0,
      ADD_TO_CART: 0,
      REMOVE_FROM_CART: 0,
      WISHLIST: 0,
      PURCHASE: 0,
    };
    interactionsByAction.forEach((item) => {
      if (item._id && Object.prototype.hasOwnProperty.call(actionCounts, item._id)) {
        actionCounts[item._id] = item.count;
      }
    });

    let recImpressions = 0;
    let recClicks = 0;
    recommendationTelemetry.forEach((item) => {
      if (item._id === 'VIEW') recImpressions = item.count;
      if (item._id === 'CLICK') recClicks = item.count;
    });

    // Zero-division safety: CTR = (clicks / impressions) * 100
    const ctr = recImpressions > 0 ? Number(((recClicks / recImpressions) * 100).toFixed(2)) : 0;

    // Ping Python AI Service Health
    let aiServiceStatus = 'offline';
    let modelVersion = 'unknown';
    let algorithms: string[] = [];
    try {
      const response = await fetch(`${env.AI_SERVICE_URL}/api/v1/recommendations/model-info`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        const info = (await response.json()) as any;
        aiServiceStatus = 'online';
        modelVersion = info.version || 'v1.0.0-hybrid';
        algorithms = info.algorithms || [];
      }
    } catch {
      aiServiceStatus = 'degraded_offline';
      modelVersion = 'v1.0.0-fallback';
    }

    return {
      period,
      totalInteractions: Object.values(actionCounts).reduce((a, b) => a + b, 0),
      actionCounts,
      telemetry: {
        recommendationImpressions: recImpressions,
        recommendationClicks: recClicks,
        clickThroughRatePercent: ctr,
      },
      aiEngine: {
        status: aiServiceStatus,
        modelVersion,
        serviceUrl: env.AI_SERVICE_URL,
        algorithms,
      },
    };
  }
}

export const dashboardService = new DashboardService();
