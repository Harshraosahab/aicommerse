import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi, AdminProduct } from '../services/adminApi';
import { formatCurrency } from '../utils/currency';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        adminApi.getProducts({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
        }),
        adminApi.getCategories(),
      ]);

      if (prodRes.success && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setDescription('');
    setPrice(0);
    setStock(0);
    setCategory(categories[0]?._id || '');
    setImageUrl('');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.SKU);
    setDescription('');
    setPrice(p.price);
    setStock(p.stock);
    setCategory(p.category?._id || '');
    setImageUrl(p.images?.[0]?.url || '');
    setIsActive(p.isActive);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload: any = {
        name,
        price: Number(price),
        stock: Number(stock),
        isActive,
      };

      if (category) payload.category = category;
      if (imageUrl) payload.images = [{ url: imageUrl, isPrimary: true }];

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct._id, payload);
      } else {
        payload.SKU = sku.toUpperCase();
        payload.description = description || `${name} product catalog item.`;
        await adminApi.createProduct(payload);
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete "${name}"?`)) return;
    try {
      await adminApi.deleteProduct(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  return (
    <>
      <SEO title="Manage Products | Admin" description="Product catalog administration and SKU publishing." />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Product Catalog</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Real-time merchandise records, variant matrices, and SKU controls.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Plus size={16} />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search products by title or SKU..."
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

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: '#fff',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Table & Content */}
      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading products...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="No real product records matched your criteria. Add a new product to publish inventory."
              action={
                <Button variant="primary" onClick={openCreateModal}>
                  + Add Product
                </Button>
              }
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const primaryImg = p.images?.[0]?.url || 'https://placehold.co/80x80?text=No+Img';
                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <img
                              src={primaryImg}
                              alt={p.name}
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{p.variants?.length ? `${p.variants.length} variants` : 'Standard product'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                          {p.sku || p.SKU || '—'}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', color: '#475569' }}>
                          {p.category?.name || 'Uncategorized'}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                          {formatCurrency(p.price)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span className={`badge ${p.stock <= 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {p.isActive ? (
                            <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                              <CheckCircle2 size={14} /> Active
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                              <XCircle size={14} /> Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                            <button
                              onClick={() => openEditModal(p)}
                              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', color: '#475569' }}
                              title="Edit product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id, p.name)}
                              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fee2e2', backgroundColor: '#fff', cursor: 'pointer', color: '#ef4444' }}
                              title="Deactivate or Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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

      {/* Product Create / Edit Modal */}
      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-product-title"
          >
            <div className="admin-modal-header">
              <h2 id="modal-product-title" className="admin-modal-title">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
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
              <div className="admin-form-error" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div>
                <div className="admin-form-group">
                  <label htmlFor="product-name" className="admin-form-label">
                    Product Name <span className="admin-required-star">*</span>
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    required
                    placeholder="e.g. Ultra-Light Running Shoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {!editingProduct && (
                  <div className="admin-form-group">
                    <label htmlFor="product-sku" className="admin-form-label">
                      SKU <span className="admin-required-star">*</span>
                    </label>
                    <input
                      id="product-sku"
                      type="text"
                      required
                      placeholder="e.g. RUN-SHOE-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <div className="admin-form-helper">Unique inventory stock keeping unit (uppercase alphanumeric)</div>
                  </div>
                )}

                <div className="admin-form-row admin-form-group">
                  <div>
                    <label htmlFor="product-price" className="admin-form-label">
                      Price (₹) <span className="admin-required-star">*</span>
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      required
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label htmlFor="product-stock" className="admin-form-label">
                      Stock Quantity <span className="admin-required-star">*</span>
                    </label>
                    <input
                      id="product-stock"
                      type="number"
                      required
                      min={0}
                      step="1"
                      placeholder="0"
                      value={stock || ''}
                      onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="product-category" className="admin-form-label">
                    Category <span className="admin-required-star">*</span>
                  </label>
                  <select
                    id="product-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.length === 0 && (
                      <option value="">No categories found — please create a category first</option>
                    )}
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="product-image" className="admin-form-label">
                    Primary Image URL
                  </label>
                  <input
                    id="product-image"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <div className="admin-form-helper">Direct public link to PNG, JPG, or WebP product image</div>
                </div>

                {!editingProduct && (
                  <div className="admin-form-group">
                    <label htmlFor="product-desc" className="admin-form-label">
                      Description
                    </label>
                    <textarea
                      id="product-desc"
                      rows={3}
                      placeholder="Enter detailed product specifications and overview..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                )}

                <div className="admin-checkbox-container">
                  <input
                    type="checkbox"
                    id="is-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="is-active" className="admin-checkbox-label">
                    Product is Active and visible in customer catalog
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
