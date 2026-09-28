import React, { useEffect, useState } from 'react';
import { ProductCard } from '../catalog/ProductCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import {
  recommendationApi,
  ScoredProduct,
  RecommendationResponseData,
} from '../../services/recommendationApi';

interface RecommendationSectionProps {
  title: string;
  subtitle?: string;
  type: 'personalized' | 'similar' | 'trending';
  productId?: string;
  limit?: number;
  emptyMessage?: string;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  subtitle,
  type,
  productId,
  limit = 4,
  emptyMessage = 'No recommendations available at this time.',
}) => {
  const [data, setData] = useState<RecommendationResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchRecommendations = async () => {
      try {
        let res: { success: boolean; data: RecommendationResponseData };
        if (type === 'similar' && productId) {
          res = await recommendationApi.getSimilar(productId, limit);
        } else if (type === 'trending') {
          res = await recommendationApi.getTrending(limit);
        } else {
          res = await recommendationApi.getPersonalized(limit);
        }

        if (isMounted) {
          if (res.success && res.data) {
            setData(res.data);

            // Telemetry: record VIEW impressions asynchronously
            if (res.data.recommendations && res.data.recommendations.length > 0) {
              res.data.recommendations.forEach((item) => {
                if (item.product?._id) {
                  recommendationApi.trackInteraction({
                    action: 'VIEW',
                    productId: item.product._id,
                    metadata: {
                      source: 'recommendations',
                      recommendationType: type,
                      algorithm: item.algorithm,
                      score: item.score,
                    },
                  }).catch(() => {
                    // Non-blocking telemetry
                  });
                }
              });
            }
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load recommendations');
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [type, productId, limit]);

  const handleProductClick = (item: ScoredProduct) => {
    if (item.product?._id) {
      recommendationApi.trackInteraction({
        action: 'CLICK',
        productId: item.product._id,
        metadata: {
          source: 'recommendations',
          recommendationType: type,
          algorithm: item.algorithm,
          score: item.score,
        },
      }).catch(() => {
        // Non-blocking telemetry
      });
    }
  };

  if (loading) {
    return (
      <section style={{ margin: 'var(--space-8) 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8) 0' }}>
          <LoadingSpinner label={`Loading ${title.toLowerCase()}...`} />
        </div>
      </section>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    if (type === 'personalized' && !error) {
      // Graceful fallback display for empty catalog
      return null;
    }
    return (
      <section style={{ margin: 'var(--space-8) 0' }}>
        <EmptyState
          icon={<span style={{ fontSize: '2.5rem' }}>✨</span>}
          title={title}
          description={error ? `Note: ${error}` : emptyMessage}
        />
      </section>
    );
  }

  return (
    <section style={{ margin: 'var(--space-10) 0' }} aria-label={title}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>{title}</h2>
            {data.coldStart ? (
              <span className="badge badge-warning" title="Cold-start fallback: genuine popular items">
                🔥 Trending Picks
              </span>
            ) : (
              <span className="badge badge-success" title="Powered by real interaction affinity">
                ⚡ AI Powered
              </span>
            )}
            {data.fallback && (
              <span className="badge badge-neutral" style={{ fontSize: '10px' }} title="Fallback: Database Affinity">
                Catalog Match
              </span>
            )}
          </div>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                margin: 'var(--space-1) 0 0',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Engine: <code>{data.modelVersion || 'v1.0.0-hybrid'}</code>
        </div>
      </div>

      {/* Grid of Recommended Products */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {data.recommendations.map((item) => (
          <div
            key={item.product._id}
            onClick={() => handleProductClick(item)}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Match Reason Tag */}
            <div
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderBottom: 'none',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                color: 'var(--color-text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.reason}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                💡 {item.reason || 'Curated pick'}
              </span>
              {item.score > 0 && (
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginLeft: '6px' }}>
                  {Math.round(item.score * 100)}%
                </span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <ProductCard product={item.product} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
