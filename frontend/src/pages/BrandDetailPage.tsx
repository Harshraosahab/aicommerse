import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProductCard } from '../components/catalog/ProductCard';
import { catalogApi, IBrand, IProduct } from '../services/catalogApi';
import { generateBreadcrumbSchema } from '../utils/structuredData';

export const BrandDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [brand, setBrand] = useState<IBrand | null>(null);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    Promise.all([
      catalogApi.getBrandBySlug(slug),
      catalogApi.getProducts({ brand: slug, limit: 40 }),
    ])
      .then(([brandRes, prodRes]) => {
        if (brandRes.success && brandRes.data?.brand) {
          setBrand(brandRes.data.brand);
        }
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Brand not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Loading brand details..." />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🏷️</span>}
          title="Brand Not Found"
          description={error || 'The requested brand could not be found.'}
          action={
            <Link to="/products" className="btn btn-outline">
              Browse Catalog
            </Link>
          }
        />
      </div>
    );
  }

  const canonicalUrl = `${window.location.origin}/brand/${brand.slug}`;
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Catalog', url: '/products' },
    { name: brand.name, url: `/brand/${brand.slug}` },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <SEO
        title={`${brand.name} - Products & Collection`}
        description={brand.description || `Browse all ${brand.name} official products.`}
        canonicalUrl={canonicalUrl}
        ogTitle={`${brand.name} | Nexus Commerce`}
        ogDescription={brand.description || `Browse all ${brand.name} official products.`}
        ogImage={brand.logo}
        ogUrl={canonicalUrl}
        schema={breadcrumbSchema}
      />

      <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Home</Link> /{' '}
          <Link to="/products" style={{ color: 'inherit' }}>Catalog</Link> /{' '}
          <span style={{ color: 'var(--color-text)' }}>{brand.name}</span>
        </nav>

        {/* Brand Header */}
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">{brand.name}</h1>
          {brand.description && (
            <p className="page-subtitle">{brand.description}</p>
          )}
          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}
            >
              Visit Official Website &rarr;
            </a>
          )}
        </div>

        {/* Brand Products */}
        {products.length === 0 ? (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📦</span>}
            title={`No products from ${brand.name} yet`}
            description="There are currently no active products published under this brand."
            action={
              <Link to="/products" className="btn btn-outline">
                Browse All Catalog Products
              </Link>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
