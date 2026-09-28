import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProductCard } from '../components/catalog/ProductCard';
import { RecommendationSection } from '../components/recommendations/RecommendationSection';
import { healthService, HealthResponsePayload } from '../services/healthService';
import { catalogApi, IProduct } from '../services/catalogApi';
import { generateOrganizationSchema } from '../utils/structuredData';

export const HomePage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponsePayload['data'] | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      healthService.checkBackendHealth(),
      catalogApi.getProducts({ isFeatured: true, limit: 4 }),
      catalogApi.getProducts({ isNewArrival: true, limit: 4 }),
    ])
      .then(([healthRes, featuredRes, newRes]) => {
        if (isMounted) {
          setHealthData(healthRes.data);
          if (featuredRes.success) setFeaturedProducts(featuredRes.data);
          if (newRes.success) setNewArrivals(newRes.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to connect to backend service');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <SEO
        title="Modern AI-Powered E-Commerce"
        description="Shop curated collections with real-time AI personalization, intelligent semantic search, and secure fast checkout."
        canonicalUrl={window.location.origin}
        ogType="website"
        ogTitle="Nexus Commerce | Modern AI E-Commerce Platform"
        ogDescription="Shop curated collections with real-time AI personalization, intelligent semantic search, and secure fast checkout."
        ogUrl={window.location.origin}
        schema={generateOrganizationSchema('Nexus Commerce', window.location.origin)}
      />

      <div className="container">
        {/* Hero Section */}
        <section className="page-header" style={{ textAlign: 'center', margin: 'var(--space-10) 0' }}>
          <span className="badge badge-neutral" style={{ marginBottom: 'var(--space-3)' }}>
            Phase 1 &bull; Production Architecture Foundation
          </span>
          <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}>
            Next-Generation AI E-Commerce Platform
          </h1>
          <p className="page-subtitle" style={{ maxWidth: '640px', margin: '0 auto var(--space-6)' }}>
            A modular, high-traffic architecture designed for dynamic data, AI-driven recommendations,
            real-time inventory, and responsive performance.
          </p>
        </section>

        {/* Real-time System Diagnostics (Verifying dynamic API & DB connectivity) */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <Card>
            <CardHeader>
              <CardTitle>System & Dependency Diagnostics</CardTitle>
            </CardHeader>
            <CardBody>
              {loading && <LoadingSpinner label="Querying backend diagnostic endpoints..." />}

              {error && (
                <div className="alert alert-warning" role="status">
                  <div>
                    <strong>Backend Status: </strong> {error}
                    <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                      Ensure backend is running at <code>http://localhost:5000</code>.
                    </div>
                  </div>
                </div>
              )}

              {healthData && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)',
                  }}
                >
                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Backend Service</div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-success)', marginTop: 'var(--space-1)' }}>
                      ● {healthData.status.toUpperCase()} (v{healthData.version})
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Database Connection</div>
                    <div
                      style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        color: healthData.dependencies.database.status === 'connected' ? 'var(--color-success)' : 'var(--color-warning)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      ● {healthData.dependencies.database.status.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Environment</div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--space-1)' }}>
                      {healthData.environment.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>System Uptime</div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--space-1)' }}>
                      {healthData.uptimeSeconds}s
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </section>

        {/* Real AI-Powered Personalized Recommendations Section */}
        <RecommendationSection
          title="Recommended For You"
          subtitle="Real-time intelligent recommendations adapted to your shopping activity"
          type="personalized"
          limit={4}
        />

        {/* Dynamic Featured Catalog Section */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Featured Catalog</h2>
            <Link to="/products?isFeatured=true" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
              View All Featured &rarr;
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '2.5rem' }}>📦</span>}
              title="No featured products available yet"
              description="Featured products will display here dynamically as they are marked in the database."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {featuredProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Dynamic New Arrivals Section */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)' }}>New Arrivals</h2>
            <Link to="/products?isNewArrival=true" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
              View All New &rarr;
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <EmptyState
              icon={<span style={{ fontSize: '2.5rem' }}>✨</span>}
              title="No new arrivals yet"
              description="New arrivals will appear here once new inventory is added to the system."
            />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {newArrivals.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

