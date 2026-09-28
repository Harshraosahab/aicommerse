import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { orderApi, Order } from '../services/orderApi';
import { formatCurrency } from '../utils/currency';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfirmedOrder = async () => {
      if (!orderId) return;
      try {
        const res = await orderApi.getOrderDetails(orderId);
        if (res.success) {
          setOrder(res.data.order);
        }
      } catch (err: any) {
        setError(err.message || 'Unable to retrieve order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
          Confirming order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) var(--space-4)', textAlign: 'center' }}>
        <SEO title="Order Status" description="View order status." />
        <h2>Order Confirmation</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-4) 0' }}>
          {error || 'Unable to verify order confirmation.'}
        </p>
        <Link to="/orders">
          <Button variant="primary">View My Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title="Order Confirmed!" description="Your order was placed successfully." noIndex={true} />

      <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', maxWidth: '750px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto var(--space-4)',
            }}
          >
            ✓
          </div>

          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', margin: '0 0 var(--space-2)' }}>
            Thank You for Your Order!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', margin: '0 0 var(--space-6)' }}>
            Your order has been placed and confirmed with real database inventory deduction.
          </p>

          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
              textAlign: 'left',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>ORDER NUMBER</div>
              <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{order.orderNumber}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>ORDER STATUS</div>
              <div style={{ fontWeight: 'bold' }}>{order.orderStatus.replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>PAYMENT METHOD</div>
              <div style={{ fontWeight: 'bold' }}>{order.paymentMethod}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>TOTAL AMOUNT</div>
              <div style={{ fontWeight: 'bold' }}>{formatCurrency(order.totalAmount, order.currency)}</div>
            </div>
          </div>

          <div style={{ textAlign: 'left', marginBottom: 'var(--space-6)', padding: '0 var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
              Shipping Destination
            </h3>
            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: '1.5', margin: 0 }}>
              <strong>{order.shippingAddress.name || 'Customer'}</strong><br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/orders/${order._id}`}>
              <Button variant="primary">View Order Details & Timeline</Button>
            </Link>
            <Link to="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
