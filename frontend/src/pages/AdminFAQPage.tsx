import React, { useState, useEffect } from 'react';
import { faqApi, FAQItem } from '../services/faqApi';

export const AdminFAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Ordering');
  const [order, setOrder] = useState<number>(0);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const categories = [
    'Ordering',
    'Payments',
    'Shipping & Delivery',
    'Returns & Refunds',
    'Account & Security',
    'Product & Inventory',
  ];

  const loadFAQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await faqApi.adminGetAllFAQs({ limit: 50 });
      setFaqs(data.faqs);
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setCategory('Ordering');
    setOrder(0);
    setIsPublished(true);
    setShowModal(true);
  };

  const handleOpenEdit = (faq: FAQItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setOrder(faq.order);
    setIsPublished(faq.isPublished);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingFaq) {
        await faqApi.adminUpdateFAQ(editingFaq._id, {
          question,
          answer,
          category,
          order,
          isPublished,
        });
      } else {
        await faqApi.adminCreateFAQ({
          question,
          answer,
          category,
          order,
          isPublished,
        });
      }
      setShowModal(false);
      loadFAQs();
    } catch (err: any) {
      alert(err.message || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await faqApi.adminDeleteFAQ(id);
      setFaqs((prev) => prev.filter((f) => f._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete FAQ');
    }
  };

  const handleSeed = async () => {
    try {
      const res = await faqApi.adminSeedFAQs();
      alert(res.message || 'Seeded FAQs successfully');
      loadFAQs();
    } catch (err: any) {
      alert(err.message || 'Failed to seed FAQs');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>FAQ & Knowledge Base Management</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Create and maintain customer-facing support articles and Help Center documentation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleSeed} className="btn btn-outline btn-sm">
            🌱 Seed Default FAQs
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            + Add New FAQ
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280' }}>No FAQs found in database. Click "Seed Default FAQs" to populate standard questions.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '13px' }}>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Question</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Order</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#374151' }}>{faq.category}</td>
                  <td style={{ padding: '12px 16px', color: '#111827' }}>
                    <div style={{ fontWeight: 600 }}>{faq.question}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                      {faq.answer.length > 80 ? `${faq.answer.slice(0, 80)}...` : faq.answer}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6b7280' }}>{faq.order}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span className={`badge ${faq.isPublished ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                      {faq.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(faq)}
                      className="btn btn-ghost btn-sm"
                      style={{ marginRight: '6px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: '#ef4444' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '600px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
              {editingFaq ? 'Edit FAQ Article' : 'Add New FAQ Article'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Question *</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Answer *</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Published
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
