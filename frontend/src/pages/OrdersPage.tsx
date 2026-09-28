import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { orderApi, Order, OrderStatus } from '../services/orderApi';
import { formatCurrency } from '../utils/currency';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = async (targetPage = 1, statusFilter = 'ALL') => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getMyOrders({
        page: targetPage,
        limit: 10,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });

      if (res.success) {
        setOrders(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
        setTotalOrders(res.data.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, selectedStatus);
  }, [page, selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'badge-success';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'badge-danger';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'badge-primary';
      case 'RETURN_REQUESTED':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const statusTabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <>
      <SEO title="My Orders" description="Track and view details of your recent orders." noIndex={true} />

      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title" style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
            My Orders
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            Track order status, manage cancellations, and request returns.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-full, 9999px)',
                border: 'none',
                background: selectedStatus === tab.value ? 'var(--color-primary)' : 'var(--color-bg-subtle, #f3f4f6)',
                color: selectedStatus === tab.value ? '#ffffff' : 'var(--color-text)',
                fontWeight: selectedStatus === tab.value ? '600' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: 'var(--font-size-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
              Loading your orders...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              marginBottom: 'var(--space-6)',
            }}
          >
            <p>⚠ {error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchOrders(page, selectedStatus)} style={{ marginTop: 'var(--space-2)' }}>
              Retry
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📜</span>}
            title={selectedStatus === 'ALL' ? 'No orders yet' : `No ${selectedStatus.toLowerCase()} orders found`}
            description={
              selectedStatus === 'ALL'
                ? 'You have not placed any orders yet. Browse our catalog and start shopping.'
                : `You do not have any orders matching the "${selectedStatus}" status.`
            }
            action={
              selectedStatus === 'ALL' ? (
                <Link to="/products">
                  <Button variant="primary">Start Shopping</Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={() => handleStatusChange('ALL')}>
                  View All Orders
                </Button>
              )
            }
          />
        )}

        {/* Order Cards List */}
        {!loading && !error && orders.length > 0 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {orders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg, 8px)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Order Number
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-base)', color: 'var(--color-primary)' }}>
                        {order.orderNumber}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Date Placed
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Total
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-base)' }}>
                        {formatCurrency(order.totalAmount, order.currency)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                      <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: order.paymentStatus === 'PAID' ? '#dcfce7' : '#fef9c3',
                          color: order.paymentStatus === 'PAID' ? '#166534' : '#854d0e',
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Card Body - Line items snippet */}
                  <div style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            background: 'var(--color-bg-subtle, #f9fafb)',
                            padding: 'var(--space-2) var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          )}
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            <span style={{ fontWeight: '500' }}>{item.name}</span>
                            {item.variantSku && (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginLeft: '4px' }}>
                                ({item.variantSku})
                              </span>
                            )}
                            <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>× {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          +{order.items.length - 4} more items
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Paid via {order.paymentMethod}
                    </span>
                    <Link to={`/orders/${order._id}`}>
                      <Button variant="outline" size="sm">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-8)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </Button>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  Page {page} of {totalPages} ({totalOrders} total orders)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};