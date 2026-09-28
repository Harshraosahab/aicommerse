import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, AdminOrder } from '../services/adminApi';
import { formatCurrency } from '../utils/currency';
import { Search, Eye, Truck, XCircle } from 'lucide-react';

const STATUS_TABS = [
  'ALL',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURN_REQUESTED',
];

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [carrier, setCarrier] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [statusComment, setStatusComment] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getOrders({
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab, search]);

  const openDetailsModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setTargetStatus(order.orderStatus || order.status);
    setCarrier(order.tracking?.carrier || '');
    setTrackingNumber(order.tracking?.trackingNumber || '');
    setStatusComment('');
    setStatusError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setIsUpdatingStatus(true);
      setStatusError(null);

      const res = await adminApi.updateOrderStatus(selectedOrder._id, {
        status: targetStatus,
        carrier: carrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        comment: statusComment.trim() || undefined,
      });

      if (res.success && res.data) {
        setSelectedOrder(res.data);
      }
      await loadOrders();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !cancelReason.trim()) return;

    try {
      setIsCancelling(true);
      await adminApi.cancelOrder(selectedOrder._id, cancelReason.trim());
      setShowCancelModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <SEO title="Order Fulfillment | Admin" description="Customer order processing, dispatch, tracking, and cancellation." />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Customer Orders & Fulfillment</h1>
        <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
          Real order lifecycle tracking, dispatch verification, and shipment coordination.
        </p>
      </div>

      {/* Tabs & Search */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: '4px' }}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: activeTab === tab ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: activeTab === tab ? 'var(--color-primary)' : '#fff',
                    color: activeTab === tab ? '#fff' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-4)',
                  paddingLeft: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-sm)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading orders...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="No real customer orders matched your active status filter."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order #</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Items</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Payment</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => {
                    const currentStatus = ord.orderStatus || ord.status;
                    return (
                      <tr key={ord._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, fontFamily: 'monospace' }}>
                          {ord.orderNumber}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div>{ord.shippingAddress?.name || ord.user?.name || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.user?.email}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {ord.items?.length || 0} items
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className={`badge ${ord.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                            {ord.paymentStatus} ({ord.paymentMethod})
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className={`badge ${currentStatus === 'DELIVERED' ? 'badge-success' : currentStatus === 'CANCELLED' ? 'badge-danger' : 'badge-primary'}`}>
                            {currentStatus}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            onClick={() => openDetailsModal(ord)}
                            style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} />
                            <span>Manage</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Order Details & Fulfillment Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Order Details: {selectedOrder.orderNumber}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {statusError && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                {statusError}
              </div>
            )}

            {/* Delivery Destination */}
            <div style={{ padding: 'var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Shipping Destination:</div>
              <div>{selectedOrder.shippingAddress?.name} ({selectedOrder.shippingAddress?.phone})</div>
              <div style={{ color: '#64748b' }}>
                {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}, {selectedOrder.shippingAddress?.country}
              </div>
            </div>

            {/* Snapshot Line Items */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>Snapshot Items:</div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Qty: {item.quantity} &bull; SKU: {item.sku || item.variantSku || 'N/A'}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} style={{ borderTop: '1px solid #e2e8f0', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Truck size={16} />
                <span>Fulfillment & Carrier Management</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Order Status *
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: '#fff', fontSize: 'var(--font-size-sm)' }}
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="PACKED">PACKED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Carrier / Logistics Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BlueDart, FedEx, Delhivery"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Waybill / Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BD123456789IN"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: 'var(--font-size-sm)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED' ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <XCircle size={14} />
                    <span>Cancel Order</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button variant="secondary" type="button" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                  <Button variant="primary" type="submit" disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancel Order Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '440px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 'var(--space-2)', color: '#b91c1c' }}>Cancel Order</h3>
            <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: '#64748b' }}>
              Cancelling this order will automatically restore reserved product inventory to the warehouse catalog.
            </p>

            <form onSubmit={handleCancelOrder}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                  Cancellation Reason (Audit Mandatory) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Customer requested cancellation before dispatch"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <Button variant="secondary" type="button" onClick={() => setShowCancelModal(false)}>
                  Back
                </Button>
                <Button variant="danger" type="submit" disabled={isCancelling || !cancelReason.trim()}>
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
