import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { Plus, Trash2, Ticket, X } from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [code, setCode] = useState<string>('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getCoupons();
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      await adminApi.createCoupon({
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        minimumOrderValue: Number(minOrder),
        startDate: new Date(startDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        isActive: true,
      });

      setShowModal(false);
      setCode('');
      await loadCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await adminApi.deleteCoupon(id);
      await loadCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <>
      <SEO title="Manage Coupons | Admin" description="Discount codes, promotional campaigns, and coupon management." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Promotions & Coupons</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Real promotional discount campaigns, minimum order thresholds, and redemption tracking.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Plus size={16} />
          <span>Create Coupon</span>
        </Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading coupons...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : coupons.length === 0 ? (
            <EmptyState
              icon={<Ticket size={32} color="#94a3b8" />}
              title="No active coupons"
              description="Create promotional coupon codes to offer discounts on purchases."
              action={
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  + Create Coupon
                </Button>
              }
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Code</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Discount</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Min Order</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Redemptions</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Valid Until</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, fontFamily: 'monospace' }}>
                        {c.code}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${c.value} OFF`}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        ₹{c.minimumOrderValue || 0}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {c.usedCount || 0} times
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                        {new Date(c.expiryDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-neutral'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteCoupon(c._id, c.code)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fee2e2', backgroundColor: '#fff', cursor: 'pointer', color: '#ef4444' }}
                          title="Delete Coupon"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Coupon Modal */}
      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Promotional Coupon</h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon}>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textTransform: 'uppercase' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                      Discount Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: '#fff' }}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
