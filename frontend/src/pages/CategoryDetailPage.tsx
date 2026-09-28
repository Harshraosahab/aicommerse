import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProductCard } from '../components/catalog/ProductCard';
import { catalogApi, ICategory, IProduct } from '../services/catalogApi';
import { generateBreadcrumbSchema } from '../utils/structuredData';

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [category, setCategory] = useState<ICategory | null>(null);
  const [subcategories, setSubcategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    Promise.all([
      catalogApi.getCategoryBySlug(slug),
      catalogApi.getProducts({ category: slug, limit: 40 }),
    ])
      .then(([catRes, prodRes]) => {
        if (catRes.success && catRes.data) {
          setCategory(catRes.data.category);
          setSubcategories(catRes.data.subcategories);
        }
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Category not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Loading category items..." />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>📁</span>}
          title="Category Not Found"
          description={error || 'The requested category does not exist.'}
          action={
            <Link to="/categories" className="btn btn-outline">
              All Categories
            </Link>
          }
        />
      </div>
    );
  }

  const canonicalUrl = `${window.location.origin}/category/${category.slug}`;
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Categories', url: '/categories' },
    { name: category.name, url: `/category/${category.slug}` },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <SEO
        title={`${category.name} - Products & Categories`}
        description={category.description || `Browse all ${category.name} products.`}
        canonicalUrl={canonicalUrl}
        ogTitle={`${category.name} | Nexus Commerce`}
        ogDescription={category.description || `Browse all ${category.name} products.`}
        ogImage={category.image}
        ogUrl={canonicalUrl}
        schema={breadcrumbSchema}
      />

      <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Home</Link> /{' '}
          <Link to="/categories" style={{ color: 'inherit' }}>Categories</Link> /{' '}
          <span style={{ color: 'var(--color-text)' }}>{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">{category.name}</h1>
          {category.description && (
            <p className="page-subtitle">{category.description}</p>
          )}
        </div>

        {/* Subcategories pills if any */}
        {subcategories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
            {subcategories.map((sub) => (
              <Link
                key={sub._id}
                to={`/category/${sub.slug}`}
                className="btn btn-secondary btn-sm"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {/* Category Products */}
        {products.length === 0 ? (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📦</span>}
            title={`No products in ${category.name} yet`}
            description="There are currently no active products in this department."
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
