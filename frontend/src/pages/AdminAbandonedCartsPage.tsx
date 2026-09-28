import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { ShoppingCart, RefreshCw, Clock, Eye } from 'lucide-react';

export const AdminAbandonedCartsPage: React.FC = () => {
  const [carts, setCarts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCarts, setTotalCarts] = useState<number>(0);

  // Selected cart for inspect modal
  const [selectedCart, setSelectedCart] = useState<any | null>(null);

  const loadCarts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getAbandonedCarts(page, 20);
      if (res.success && Array.isArray(res.data)) {
        setCarts(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCarts(res.meta.total || res.data.length);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch abandoned carts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCarts();
  }, [page]);

  return (
    <>
      <SEO title="Abandoned Carts | Admin" description="Inactive user shopping carts and recovery insights." />

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShoppingCart size={26} color="#d97706" />
            Abandoned Shopping Carts
          </h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Unconverted customer carts idle for over 24 hours. Real MongoDB cart records only ({totalCarts} total detected).
          </p>
        </div>
        <Button variant="secondary" onClick={loadCarts} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Querying inactive cart sessions from database...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : carts.length === 0 ? (
            <EmptyState
              title="No abandoned carts"
              description="Zero abandoned carts identified. All customer shopping carts are either active or converted into orders."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Idle Since</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Items</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Total Value</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map((cart) => {
                    const cartId = cart._id || cart.id;
                    const customerEmail = cart.user?.email || cart.customerEmail || 'Guest / Anonymous';
                    const customerName = cart.user ? `${cart.user.firstName || ''} ${cart.user.lastName || ''}`.trim() : '';
                    const itemsCount = cart.items ? cart.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 0;
                    const idleDate = cart.updatedAt ? new Date(cart.updatedAt).toLocaleString() : 'N/A';

                    // Estimate value
                    const totalVal = cart.items
                      ? cart.items.reduce((sum: number, item: any) => {
                          const p = item.product?.price || item.price || 0;
                          return sum + p * (item.quantity || 1);
                        }, 0)
                      : 0;

                    return (
                      <tr key={cartId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 600 }}>{customerName || customerEmail}</div>
                          {customerName && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{customerEmail}</div>}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {idleDate}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontWeight: 600 }}>{itemsCount}</span> items
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: '#0f172a' }}>
                          ₹{totalVal.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button size="sm" variant="secondary" onClick={() => setSelectedCart(cart)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={14} />
                            Inspect Items
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

      {/* Cart Items Inspection Modal */}
      {selectedCart && (
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
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Abandoned Cart Items</h3>
              <button
                onClick={() => setSelectedCart(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {selectedCart.items && selectedCart.items.map((item: any, idx: number) => {
                  const title = item.product?.title || item.product?.name || item.title || 'Product Item';
                  const price = item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;

                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Qty: {qty} &times; ₹{price.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                        ₹{(price * qty).toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
