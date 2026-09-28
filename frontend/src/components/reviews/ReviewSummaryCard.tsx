import React, { useState, useEffect } from 'react';
import { aiApi, ReviewSummaryResponse } from '../../services/aiApi';

interface ReviewSummaryCardProps {
  productId: string;
}

export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({ productId }) => {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    aiApi
      .getReviewSummary(productId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setSummary(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load AI review summary');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div
        className="review-summary-skeleton"
        style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
          <span>✨</span>
          <span>Analyzing authentic customer reviews...</span>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return null; // Gracefully omit if error occurred
  }

  // Honest Insufficient Data State
  if (summary.insufficientData) {
    return (
      <div
        data-testid="insufficient-reviews-banner"
        style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>
            AI Review Summary Unavailable
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            {summary.insufficientDataReason ||
              `At least 3 customer reviews are required to generate an authentic AI aspect summary. Currently ${summary.totalReviewsAnalyzed} review(s) submitted.`}
          </div>
        </div>
      </div>
    );
  }

  const sentimentColors: Record<string, { bg: string; text: string }> = {
    POSITIVE: { bg: '#dcfce7', text: '#15803d' },
    NEUTRAL: { bg: '#f1f5f9', text: '#475569' },
    NEGATIVE: { bg: '#fee2e2', text: '#b91c1c' },
    MIXED: { bg: '#fef3c7', text: '#b45309' },
  };

  const badgeStyle = sentimentColors[summary.overallSentiment] || sentimentColors.NEUTRAL;

  return (
    <div
      data-testid="ai-review-summary"
      style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
            AI Review Highlights
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 600,
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
            }}
          >
            {summary.overallSentiment} SENTIMENT
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Synthesized from {summary.totalReviewsAnalyzed} verified customer reviews
        </div>
      </div>

      {/* Pros & Cons Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Pros */}
        {summary.pros && summary.pros.length > 0 && (
          <div
            style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid #bbf7d0',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#166534', marginBottom: '8px' }}>
              ✓ Customer Praises
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#15803d' }}>
              {summary.pros.map((pro, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons */}
        {summary.cons && summary.cons.length > 0 && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
              ⚠ Reported Considerations
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#b91c1c' }}>
              {summary.cons.map((con, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Topics */}
      {summary.commonTopics && summary.commonTopics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Key Topics:</span>
          {summary.commonTopics.map((topic, tIdx) => (
            <span
              key={tIdx}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              #{topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
