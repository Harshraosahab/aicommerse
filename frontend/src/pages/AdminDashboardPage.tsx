import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, DashboardMetrics, SalesAnalyticsPoint } from '../services/adminApi';
import { recommendationApi, RecommendationAnalytics } from '../services/recommendationApi';
import { formatCurrency } from '../utils/currency';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalyticsPoint[]>([]);
  const [recAnalytics, setRecAnalytics] = useState<RecommendationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [metricsRes, analyticsRes, recRes] = await Promise.all([
          adminApi.getMetrics(period),
          adminApi.getSalesAnalytics(period),
          recommendationApi.getAnalytics(period).catch(() => ({ success: false, data: null as any })),
        ]);

        if (isMounted) {
          if (metricsRes.success && metricsRes.data) {
            setMetrics(metricsRes.data);
          }
          if (analyticsRes.success && Array.isArray(analyticsRes.data)) {
            setSalesAnalytics(analyticsRes.data);
          }
          if (recRes && recRes.success && recRes.data) {
            setRecAnalytics(recRes.data);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve dashboard metrics');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [period]);

  // SVG Chart Calculations
  const maxRevenue = salesAnalytics.length > 0
    ? Math.max(...salesAnalytics.map((p) => p.revenue), 1)
    : 1;

  return (
    <>
      <SEO title="Admin Dashboard | Real Metrics" description="Real-time merchant metrics and operations control." />

      {/* Page Header with Time Period Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Executive Dashboard - Admin Control Center</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Real MongoDB telemetry and database analytics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Link
              to="/admin/products"
              style={{
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Products
            </Link>
            <Link
              to="/admin/orders"
              style={{
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Orders
            </Link>
          </div>

          {/* Date Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock size={16} color="#64748b" />
            <label htmlFor="period-select" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Period:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: '#fff',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div className="animate-spin" style={{ display: 'inline-block', fontSize: '2rem' }}>
            ⏳
          </div>
          <p style={{ marginTop: 'var(--space-3)', color: '#64748b' }}>Calculating real metrics from database...</p>
        </div>
      ) : error ? (
        <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', marginBottom: 'var(--space-6)' }}>
          <CardBody>
            <div style={{ color: '#b91c1c', fontWeight: 600 }}>Error loading dashboard: {error}</div>
          </CardBody>
        </Card>
      ) : metrics ? (
        <>
          {/* Key Metric Stats Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {/* Net Revenue */}
            <Card>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748b', fontWeight: 500 }}>
                    Net Revenue
                  </span>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-2)' }}>
                  {formatCurrency(metrics.financials.netRevenue)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 'var(--space-1)' }}>
                  {metrics.financials.paidOrdersCount} paid orders ({metrics.financials.refundedAmount > 0 ? `refunds: ${formatCurrency(metrics.financials.refundedAmount)}` : 'zero refunds'})
                </div>
              </CardBody>
            </Card>

            {/* Total Orders */}
            <Card>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748b', fontWeight: 500 }}>
                    Orders
                  </span>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-2)' }}>
                  {metrics.orders.total}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 'var(--space-1)' }}>
                  {metrics.orders.delivered} delivered &bull; {metrics.orders.pending} pending &bull; {metrics.orders.cancelled} cancelled
                </div>
              </CardBody>
            </Card>

            {/* Catalog Stock */}
            <Card>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748b', fontWeight: 500 }}>
                    Products
                  </span>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fdf4ff', color: '#9333ea' }}>
                    <Package size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-2)' }}>
                  {metrics.products.total}
                </div>
                <div style={{ fontSize: '11px', color: metrics.products.lowStock > 0 ? '#d97706' : '#64748b', marginTop: 'var(--space-1)' }}>
                  {metrics.products.lowStock} low stock &bull; {metrics.products.outOfStock} out of stock
                </div>
              </CardBody>
            </Card>

            {/* Customers */}
            <Card>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: '#64748b', fontWeight: 500 }}>
                    Customers
                  </span>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-2)' }}>
                  {metrics.users.total}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: 'var(--space-1)' }}>
                  {metrics.users.active} active accounts &bull; {metrics.users.new} new in period
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Operational Alerts Bar if applicable */}
          {(metrics.products.lowStock > 0 || metrics.orders.returnRequested > 0 || metrics.abandonedCarts > 0) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-6)',
              }}
            >
              {metrics.products.lowStock > 0 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#b45309' }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                      {metrics.products.lowStock} Low Stock Alert
                    </span>
                  </div>
                  <Link to="/admin/inventory" style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                    Restock &rarr;
                  </Link>
                </div>
              )}

              {metrics.orders.returnRequested > 0 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#b91c1c' }}>
                    <RotateCcw size={16} />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                      {metrics.orders.returnRequested} Return Requests
                    </span>
                  </div>
                  <Link to="/admin/returns" style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
                    Review &rarr;
                  </Link>
                </div>
              )}

              {metrics.abandonedCarts > 0 && (
                <div
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: '#475569' }}>
                    <ShoppingCart size={16} />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                      {metrics.abandonedCarts} Abandoned Carts
                    </span>
                  </div>
                  <Link to="/admin/abandoned-carts" style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                    View &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Sales Analytics Chart Card */}
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <TrendingUp size={18} color="var(--color-primary)" />
                <CardTitle>Sales & Revenue Velocity</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {salesAnalytics.length === 0 ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#94a3b8' }}>
                  No sales recorded in the selected time period ({period}).
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <div style={{ minWidth: '480px', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                    {salesAnalytics.map((point) => {
                      const heightPercent = Math.max(4, Math.round((point.revenue / maxRevenue) * 100));
                      return (
                        <div
                          key={point.date}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '32px',
                              height: `${heightPercent}%`,
                              backgroundColor: '#38bdf8',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease',
                              cursor: 'pointer',
                            }}
                            title={`${point.date}: ${formatCurrency(point.revenue)} (${point.orders} orders)`}
                          />
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#64748b',
                              marginTop: '6px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '50px',
                            }}
                          >
                            {point.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Recommendation Engine & Telemetry Card */}
          {recAnalytics && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Sparkles size={18} color="var(--color-primary)" />
                    <CardTitle>AI Recommendation Engine Telemetry</CardTitle>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span className={`badge ${recAnalytics.aiEngine.status === 'online' ? 'badge-success' : 'badge-warning'}`}>
                      Engine: {recAnalytics.aiEngine.status.toUpperCase()}
                    </span>
                    <span className="badge badge-neutral">
                      {recAnalytics.aiEngine.modelVersion}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Recommendation CTR</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: 'var(--space-1)' }}>
                      {recAnalytics.telemetry.clickThroughRatePercent}%
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Rec Impressions</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                      {recAnalytics.telemetry.recommendationImpressions}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Rec Clicks</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                      {recAnalytics.telemetry.recommendationClicks}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Total Interactions</div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginTop: 'var(--space-1)' }}>
                      {recAnalytics.totalInteractions}
                    </div>
                  </div>
                </div>

                {/* Telemetry Actions Breakdown */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                  <span>Views: <strong>{recAnalytics.actionCounts.VIEW || 0}</strong></span>
                  <span>Clicks: <strong>{recAnalytics.actionCounts.CLICK || 0}</strong></span>
                  <span>Cart Adds: <strong>{recAnalytics.actionCounts.ADD_TO_CART || 0}</strong></span>
                  <span>Wishlists: <strong>{recAnalytics.actionCounts.WISHLIST || 0}</strong></span>
                  <span>Purchases: <strong>{recAnalytics.actionCounts.PURCHASE || 0}</strong></span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Orders Section */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Recent Orders</CardTitle>
                <Link to="/admin/orders" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>View all orders</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </CardHeader>
            <CardBody style={{ padding: 0 }}>
              {metrics.recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="Real customer orders will populate here as purchases are placed."
                />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order #</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order Status</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Payment</th>
                        <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentOrders.map((ord) => (
                        <tr key={ord._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                            <Link to={`/admin/orders`} style={{ color: 'var(--color-primary)' }}>
                              {ord.orderNumber}
                            </Link>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            {ord.shippingAddress?.name || 'Customer'}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                            {formatCurrency(ord.totalAmount)}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className={`badge ${ord.status === 'DELIVERED' ? 'badge-success' : ord.status === 'CANCELLED' ? 'badge-danger' : 'badge-primary'}`}>
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <span className={`badge ${ord.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </>
  );
};
