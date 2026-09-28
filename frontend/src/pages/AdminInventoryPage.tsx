import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, InventoryItem } from '../services/adminApi';
import { formatCurrency } from '../utils/currency';
import { Search, SlidersHorizontal, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [threshold, setThreshold] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; sku: string; currentStock: number; variantSku?: string } | null>(null);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getInventory({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
        if (res.meta?.threshold) setThreshold(res.meta.threshold);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [search, statusFilter]);

  const openAdjustModal = (id: string, name: string, sku: string, currentStock: number, variantSku?: string) => {
    setSelectedItem({ id, name, sku, currentStock, variantSku });
    setAdjustment(0);
    setReason('');
    setAdjustError(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (adjustment === 0) {
      setAdjustError('Adjustment delta cannot be zero.');
      return;
    }

    if (selectedItem.currentStock + adjustment < 0) {
      setAdjustError('Cannot reduce stock below 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      setAdjustError(null);

      await adminApi.adjustStock({
        productId: selectedItem.id,
        variantSku: selectedItem.variantSku,
        adjustment,
        reason,
      });

      setSelectedItem(null);
      await loadInventory();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Inventory Management | Admin" description="Warehouse stock tracking, SKU adjustments, and audit trail." />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Warehouse Inventory & Stock Control</h1>
        <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
          Real-time SKU quantities, threshold alerts, and traceable stock adjustments with audit logging.
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search inventory by title or SKU..."
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Inventory</option>
              <option value="low_stock">Low Stock (&le; {threshold})</option>
              <option value="out_of_stock">Out of Stock (0)</option>
              <option value="in_stock">In Stock (&gt; {threshold})</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading inventory levels...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No inventory records found"
              description="No matching SKU records found in MongoDB."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Product Title</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Available Stock</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontWeight: 600 }}>
                          {item.sku}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                          {item.name}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {formatCurrency(item.price)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, fontSize: '1rem' }}>
                          {item.stock}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {item.stockStatus === 'OUT_OF_STOCK' ? (
                            <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <XCircle size={14} /> Out of Stock
                            </span>
                          ) : item.stockStatus === 'LOW_STOCK' ? (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <AlertTriangle size={14} /> Low Stock (&le;{threshold})
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <CheckCircle2 size={14} /> In Stock
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            onClick={() => openAdjustModal(item.id, item.name, item.sku, item.stock)}
                            style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <SlidersHorizontal size={13} />
                            <span>Adjust</span>
                          </Button>
                        </td>
                      </tr>

                      {/* Variant Sub-rows */}
                      {item.variants?.map((v) => (
                        <tr key={v.sku} style={{ backgroundColor: '#fcfcfd', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: 'var(--space-2) var(--space-4)', paddingLeft: 'var(--space-8)', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                            &bull; {v.sku}
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '12px', color: '#475569' }}>
                            Variant: {v.name}
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-4)', fontSize: '12px' }}>
                            {formatCurrency(v.price)}
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 600 }}>
                            {v.stock}
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-4)' }}>
                            <span className={`badge ${v.stock <= 0 ? 'badge-danger' : v.stock <= threshold ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '10px' }}>
                              {v.stockStatus}
                            </span>
                          </td>
                          <td style={{ padding: 'var(--space-2) var(--space-4)', textAlign: 'right' }}>
                            <button
                              onClick={() => openAdjustModal(item.id, `${item.name} (${v.name})`, v.sku, v.stock, v.sku)}
                              style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' }}
                            >
                              Adjust Variant
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
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
            <h3 style={{ margin: 0, marginBottom: 'var(--space-2)' }}>Adjust Stock Quantity</h3>
            <p style={{ margin: 0, marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: '#64748b' }}>
              {selectedItem.name} (<span style={{ fontFamily: 'monospace' }}>{selectedItem.sku}</span>)
            </p>

            {adjustError && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <span>Current On-Hand Stock:</span>
                  <span style={{ fontWeight: 700 }}>{selectedItem.currentStock} units</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Adjustment Delta (+ to add, - to reduce) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={adjustment}
                    onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1.1rem', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                  <span>Resulting New Stock:</span>
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {selectedItem.currentStock + adjustment} units
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Reason for Adjustment (Audit Mandatory) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Received new supplier stock, Damaged goods removal"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button variant="secondary" type="button" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting || adjustment === 0}>
                  {isSubmitting ? 'Recording...' : 'Commit Adjustment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
