import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { orderApi, Order, OrderItem, OrderStatus, OrderInvoice } from '../services/orderApi';
import { formatCurrency } from '../utils/currency';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Invoice Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoice, setInvoice] = useState<OrderInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderApi.getOrderDetails(id);
      if (res.success) {
        setOrder(res.data.order);
        const initialQty: Record<string, number> = {};
        res.data.order.items.forEach((item: OrderItem) => {
          const maxReturn = item.quantity - (item.returnedQuantity || 0);
          if (maxReturn > 0) {
            initialQty[item.product] = maxReturn;
          }
        });
        setReturnQuantities(initialQty);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !cancelReason.trim()) return;

    setCancelling(true);
    setCancelError(null);
    try {
      const res = await orderApi.cancelOrder(order._id, { reason: cancelReason.trim() });
      if (res.success) {
        setOrder(res.data.order);
        setShowCancelModal(false);
        setCancelReason('');
      }
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !returnReason.trim()) return;

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const orderItem = order.items.find((i) => i.product === productId);
        return {
          productId,
          variantSku: orderItem?.variantSku,
          quantity,
        };
      });

    if (itemsToReturn.length === 0) {
      setReturnError('Please select at least one item to return');
      return;
    }

    setSubmittingReturn(true);
    setReturnError(null);
    try {
      const res = await orderApi.requestReturn(order._id, {
        reason: returnReason.trim(),
        details: returnDetails.trim() || undefined,
        items: itemsToReturn,
      });
      if (res.success) {
        setOrder(res.data.order);
        setShowReturnModal(false);
        setReturnReason('');
        setReturnDetails('');
      }
    } catch (err: any) {
      setReturnError(err.message || 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleOpenInvoice = async () => {
    if (!order) return;
    setShowInvoiceModal(true);
    setLoadingInvoice(true);
    try {
      const res = await orderApi.getInvoice(order._id);
      if (res.success) {
        setInvoice(res.data.invoice);
      }
    } catch {
      // Handled in modal
    } finally {
      setLoadingInvoice(false);
    }
  };

  const timelineStages: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const getStageIndex = (status: OrderStatus) => {
    return timelineStages.indexOf(status);
  };

  const currentStageIdx = order ? getStageIndex(order.orderStatus) : -1;
  const isCancelled = order?.orderStatus === 'CANCELLED';
  const isReturnRequested = order?.orderStatus === 'RETURN_REQUESTED' || order?.orderStatus === 'RETURNED';

  const canCancel = order && ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus);
  const canReturn = order && order.orderStatus === 'DELIVERED';

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
          Loading order details...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) var(--space-4)', textAlign: 'center' }}>
        <SEO title="Order Not Found" description="The requested order could not be located." />
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-4) 0' }}>
          {error || 'This order does not exist or does not belong to your account.'}
        </p>
        <Link to="/orders">
          <Button variant="primary">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Order ${order.orderNumber}`}
        description={`Details and tracking status for order ${order.orderNumber}.`}
        noIndex={true}
      />

      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '1000px' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/orders" style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)', textDecoration: 'none' }}>
            ← Back to All Orders
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', margin: 0 }}>
              Order {order.orderNumber}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
              Placed on {new Date(order.createdAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="outline" size="sm" onClick={handleOpenInvoice}>
              📄 View Invoice
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Cancel Order
              </Button>
            )}
            {canReturn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnModal(true)}
                style={{ color: '#d97706', borderColor: '#fcd34d' }}
              >
                Request Return
              </Button>
            )}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg, 8px)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Order Status: <span style={{ color: isCancelled ? '#dc2626' : 'var(--color-primary)' }}>{order.orderStatus.replace(/_/g, ' ')}</span>
          </h2>

          {isCancelled ? (
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
              }}
            >
              <strong>This order has been cancelled.</strong>
              {order.cancellation?.reason && <p style={{ marginTop: 'var(--space-1)' }}>Reason: {order.cancellation.reason}</p>}
            </div>
          ) : isReturnRequested ? (
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: 'var(--radius-md)',
                color: '#92400e',
              }}
            >
              <strong>Return Status: {order.returnRequest?.status || 'REQUESTED'}</strong>
              <p style={{ marginTop: 'var(--space-1)' }}>Reason: {order.returnRequest?.reason}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  minWidth: '600px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '20px',
                    right: '20px',
                    height: '3px',
                    backgroundColor: 'var(--color-border)',
                    zIndex: 0,
                  }}
                />

                {timelineStages.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIdx;
                  const isCurrent = idx === currentStageIdx;

                  return (
                    <div
                      key={stage}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1,
                        width: '80px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isCompleted ? 'var(--color-primary)' : 'var(--color-bg)',
                          border: `2px solid ${isCompleted ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          color: isCompleted ? '#ffffff' : 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span
                        style={{
                          marginTop: 'var(--space-2)',
                          fontSize: '11px',
                          textAlign: 'center',
                          fontWeight: isCurrent ? 'bold' : 'normal',
                          color: isCompleted ? 'var(--color-text)' : 'var(--color-text-muted)',
                        }}
                      >
                        {stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.tracking?.trackingNumber && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <div>
                <strong>Carrier:</strong> {order.tracking.carrier || 'Express Logistics'} |{' '}
                <strong>Tracking #:</strong> {order.tracking.trackingNumber}
              </div>
              {order.tracking.trackingUrl && (
                <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                  Track Package ↗
                </a>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg, 8px)',
              padding: 'var(--space-5)',
            }}
          >
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Items Purchased ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    paddingBottom: 'var(--space-3)',
                    borderBottom: idx < order.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: 'var(--font-size-base)' }}>
                      {item.name}
                    </div>
                    {item.variantSku && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        Variant SKU: {item.variantSku}
                      </div>
                    )}
                    <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                      Price: {formatCurrency(item.price, order.currency)} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-base)' }}>
                    {formatCurrency(item.lineTotal, order.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg, 8px)',
                padding: 'var(--space-5)',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                Delivery Destination
              </h2>
              <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '600' }}>{order.shippingAddress.name || 'Recipient'}</div>
                {order.shippingAddress.phone && <div>📞 {order.shippingAddress.phone}</div>}
                <div>{order.shippingAddress.street}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg, 8px)',
                padding: 'var(--space-5)',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>
                Payment Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payment Method</span>
                  <span style={{ fontWeight: '500' }}>{order.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payment Status</span>
                  <span style={{ fontWeight: '600', color: order.paymentStatus === 'PAID' ? '#166534' : '#854d0e' }}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Shipping Fee</span>
                  <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee, order.currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Tax</span>
                  <span>{formatCurrency(order.tax, order.currency)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-2) 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--color-primary)' }}>
                    {formatCurrency(order.totalAmount, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg, 8px)',
                padding: 'var(--space-6)',
                maxWidth: '500px',
                width: '100%',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                Cancel Order {order.orderNumber}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                Are you sure you want to cancel this order? This action will restore product inventory.
              </p>

              {cancelError && (
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  ⚠ {cancelError}
                </div>
              )}

              <form onSubmit={handleCancelOrder}>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    marginBottom: 'var(--space-4)',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button variant="outline" type="button" onClick={() => setShowCancelModal(false)}>
                    Keep Order
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={cancelling || !cancelReason.trim()}
                    style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  >
                    {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg, 8px)',
                padding: 'var(--space-6)',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                Request Return: {order.orderNumber}
              </h2>

              {returnError && (
                <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  ⚠ {returnError}
                </div>
              )}

              <form onSubmit={handleReturnSubmit}>
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: 'var(--space-1)' }}>
                    Reason for Return:
                  </label>
                  <select
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  >
                    <option value="">Select a reason...</option>
                    <option value="Damaged or defective item">Damaged or defective item</option>
                    <option value="Item not as described">Item not as described</option>
                    <option value="Incorrect item or size received">Incorrect item or size received</option>
                    <option value="No longer needed">No longer needed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <Button variant="outline" type="button" onClick={() => setShowReturnModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submittingReturn}>
                    {submittingReturn ? 'Submitting...' : 'Submit Return'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--space-4)',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg, 8px)',
                padding: 'var(--space-8)',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                color: '#111827',
              }}
            >
              {loadingInvoice || !invoice ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>INVOICE</h2>
                      <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Invoice #: {invoice.invoiceNumber}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>Order #: {invoice.orderNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '14px', color: '#4b5563' }}>
                      <div style={{ fontWeight: 'bold' }}>AI Commerce Platform</div>
                      <div>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 'var(--space-6)', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #d1d5db', textAlign: 'left', backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '8px' }}>Item</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px' }}>{item.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.unitPrice, invoice.currency)}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(item.lineTotal, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)', fontSize: '14px' }}>
                    <div style={{ width: '250px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(invoice.financials.subtotal, invoice.currency)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Shipping:</span>
                        <span>{invoice.financials.shippingFee === 0 ? 'FREE' : formatCurrency(invoice.financials.shippingFee, invoice.currency)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #111827', fontWeight: 'bold' }}>
                        <span>Total:</span>
                        <span>{formatCurrency(invoice.financials.totalAmount, invoice.currency)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      🖨 Print Invoice
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setShowInvoiceModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
