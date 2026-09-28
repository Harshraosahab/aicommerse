import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { CheckCircle, XCircle, Trash2, Star } from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterApproved, setFilterApproved] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getReviews({
        isApproved: filterApproved === '' ? undefined : filterApproved === 'true',
      });
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterApproved]);

  const handleModerate = async (reviewId: string, action: 'APPROVE' | 'REJECT' | 'DELETE') => {
    try {
      await adminApi.moderateReview(reviewId, action);
      await loadReviews();
    } catch (err: any) {
      alert(err.message || `Failed to ${action.toLowerCase()} review`);
    }
  };

  return (
    <>
      <SEO title="Reviews Moderation | Admin" description="Customer reviews moderation and rating calculation." />

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Customer Reviews Moderation</h1>
        <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
          Review submitted customer ratings and approve or reject content with automatic product rating recalculation.
        </p>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Filter by Status:</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: '#fff',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="">All Reviews</option>
              <option value="true">Approved</option>
              <option value="false">Pending / Rejected</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading reviews...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No reviews in queue"
              description="Zero customer reviews match the active filter criteria."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Rating</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Comment</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                        {r.product?.name || 'Product'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div>{r.user?.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.user?.email}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontWeight: 600 }}>
                          <Star size={14} fill="#f59e0b" />
                          <span>{r.rating} / 5</span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{r.title}</div>
                        <div style={{ color: '#475569', whiteSpace: 'normal' }}>{r.comment}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span className={`badge ${r.isApproved ? 'badge-success' : 'badge-warning'}`}>
                          {r.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
                          {!r.isApproved ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleModerate(r._id, 'APPROVE')}
                              style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}
                            >
                              <CheckCircle size={13} />
                              <span>Approve</span>
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              onClick={() => handleModerate(r._id, 'REJECT')}
                              style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#ea580c' }}
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </Button>
                          )}

                          <button
                            onClick={() => handleModerate(r._id, 'DELETE')}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #fee2e2', backgroundColor: '#fff', cursor: 'pointer', color: '#dc2626' }}
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
};
