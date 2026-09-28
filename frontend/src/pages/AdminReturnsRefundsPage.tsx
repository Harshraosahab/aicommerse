import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { formatCurrency } from '../utils/currency';
import { RotateCcw } from 'lucide-react';

export const AdminReturnsRefundsPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'returns' | 'refunds'>('returns');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Return Decision Modal
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (activeTab === 'returns') {
        const res = await adminApi.getReturns();
        if (res.success && Array.isArray(res.data)) {
          setReturns(res.data);
        }
      } else {
        const res = await adminApi.getRefunds();
        if (res.success && Array.isArray(res.data)) {
          setRefunds(res.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn || !decisionReason.trim()) return;

    try {
      setIsSubmittingDecision(true);
      await adminApi.decideReturn(selectedReturn._id, decision, decisionReason.trim());
      setSelectedReturn(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to process decision');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <>
      <SEO title="Returns & Refunds | Admin" description="Customer return request inspections and refund processing." />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Returns & Refund Operations</h1>
        <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
          Review item return requests, inspect returns, and execute refunds against eligible orders.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => setActiveTab('returns')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            border: 'none',
            backgroundColor: activeTab === 'returns' ? 'var(--color-primary)' : '#fff',
            color: activeTab === 'returns' ? '#fff' : '#475569',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Return Requests
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            border: 'none',
            backgroundColor: activeTab === 'refunds' ? 'var(--color-primary)' : '#fff',
            color: activeTab === 'refunds' ? '#fff' : '#475569',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          Refunds Ledger
        </button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading data...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : activeTab === 'returns' ? (
            returns.length === 0 ? (
              <EmptyState
                icon={<RotateCcw size={32} color="#94a3b8" />}
                title="No pending return requests"
                description="Zero return requests are currently pending in MongoDB."
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order #</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Reason</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Requested</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ord) => (
                      <tr key={ord._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {ord.orderNumber || (ord.orderId ? `#${ord.orderId.slice(-6)}` : '—')}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div>{ord.shippingAddress?.name || ord.user?.name || ord.customerName || ord.customerEmail || 'Customer'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{ord.user?.email || ord.customerEmail || ''}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {ord.returnRequest?.reason || ord.reason || 'No reason provided'}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className={`badge ${((ord.returnRequest?.status || ord.status) === 'APPROVED') ? 'badge-success' : ((ord.returnRequest?.status || ord.status) === 'REJECTED') ? 'badge-danger' : 'badge-warning'}`}>
                            {ord.returnRequest?.status || ord.status || 'REQUESTED'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                          {ord.returnRequest?.requestedAt || ord.createdAt ? new Date(ord.returnRequest?.requestedAt || ord.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          {ord.returnRequest?.status === 'REQUESTED' && (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setSelectedReturn(ord);
                                setDecision('APPROVED');
                                setDecisionReason('');
                              }}
                              style={{ fontSize: '12px', padding: '4px 10px' }}
                            >
                              Review Decision
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            refunds.length === 0 ? (
              <EmptyState
                title="No refunds recorded"
                description="Zero refunds have been issued on historical orders."
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order #</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Order Total</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Refund Amount</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Payment Status</th>
                      <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Refund Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((ref, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {ref.orderNumber}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {ref.customer?.name} ({ref.customer?.email})
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {formatCurrency(ref.totalAmount)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: '#dc2626' }}>
                          {formatCurrency(ref.refund?.amount || 0)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className="badge badge-neutral">{ref.paymentStatus}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className={`badge ${ref.refund?.status === 'PROCESSED' ? 'badge-success' : 'badge-warning'}`}>
                            {ref.refund?.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardBody>
      </Card>

      {/* Return Decision Modal */}
      {selectedReturn && (
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
              maxWidth: '460px',
              width: '100%',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Decide Return Request</h3>
            <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: '#64748b' }}>
              Order: {selectedReturn.orderNumber} &bull; Customer: {selectedReturn.shippingAddress?.name}
            </p>

            <form onSubmit={handleDecisionSubmit}>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Decision *
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="decision"
                        value="APPROVED"
                        checked={decision === 'APPROVED'}
                        onChange={() => setDecision('APPROVED')}
                      />
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Approve Return</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="decision"
                        value="REJECTED"
                        checked={decision === 'REJECTED'}
                        onChange={() => setDecision('REJECTED')}
                      />
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>Reject Return</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Reason / Inspector Notes (Audit Mandatory) *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Products returned with original tags intact"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button variant="secondary" type="button" onClick={() => setSelectedReturn(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingDecision || !decisionReason.trim()}>
                  {isSubmittingDecision ? 'Submitting...' : 'Submit Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
