import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { CreditCard, RefreshCw, CheckCircle, Clock, XCircle, RotateCcw, Eye } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPayments, setTotalPayments] = useState<number>(0);

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getPayments({
        page,
        limit: 20,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setPayments(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalPayments(res.meta.total || res.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments ledger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page, statusFilter, methodFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return (
          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            Pending
          </span>
        );
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return (
          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RotateCcw size={12} />
            {status}
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      <SEO title="Payments Ledger | Admin" description="Financial transactions and payment processing records." />

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CreditCard size={26} color="#059669" />
            Financial & Payment Transactions
          </h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Real-time ledger of Razorpay transactions, Cash on Delivery collections, and reconciliation logs.
          </p>
        </div>
        <Button variant="secondary" onClick={loadPayments} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Payment Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Method:</label>
              <select
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Methods</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="COD">Cash on Delivery</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="NETBANKING">Netbanking</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#64748b' }}>
              Total Records: {totalPayments}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Fetching transaction ledger from database...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="No real payment records matched the filter criteria in the database."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Transaction ID / Gateway Ref</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order Ref</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Method</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const payId = p._id || p.id;
                    const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—';
                    const orderId = p.order?._id || p.orderId || p.orderNumber || '—';
                    const customerEmail = p.user?.email || p.order?.shippingAddress?.email || 'Customer';

                    return (
                      <tr key={payId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                            {p.transactionId || p.paymentId || (p.gatewayResponse && p.gatewayResponse.razorpay_payment_id) || `#${payId.slice(-8)}`}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dateStr}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            #{orderId.toString().slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 500 }}>{customerEmail}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontWeight: 600, color: '#475569' }}>{p.method || p.paymentMethod || 'Razorpay'}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: '#0f172a' }}>
                          ₹{(p.amount || p.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {getStatusBadge(p.status || p.paymentStatus)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button size="sm" variant="secondary" onClick={() => setSelectedPayment(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', borderTop: '1px solid #e2e8f0' }}>
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                Page {page} of {totalPages}
              </span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
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
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Payment Transaction Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: '#64748b' }}>Internal Transaction ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedPayment._id || selectedPayment.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: '#64748b' }}>Gateway Payment ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedPayment.transactionId || selectedPayment.gatewayResponse?.razorpay_payment_id || 'N/A (Cash on Delivery)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: '#64748b' }}>Gateway Order ID</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {selectedPayment.gatewayResponse?.razorpay_order_id || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: '#64748b' }}>Amount Settled</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#16a34a' }}>
                    ₹{(selectedPayment.amount || selectedPayment.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                  <span style={{ color: '#64748b' }}>Payment Method</span>
                  <span style={{ fontWeight: 600 }}>{selectedPayment.method || selectedPayment.paymentMethod || 'Razorpay'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status</span>
                  <div>{getStatusBadge(selectedPayment.status || selectedPayment.paymentStatus)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
