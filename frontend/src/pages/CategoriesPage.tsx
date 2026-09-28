import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { catalogApi, ICategory } from '../services/catalogApi';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((res) => {
        if (res.success && res.data?.categories) {
          setCategories(res.data.categories);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load categories');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <SEO
        title="Product Categories"
        description="Browse our taxonomy of product categories and sub-departments."
        canonicalUrl="/categories"
      />

      <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organized taxonomies and department hierarchies.</p>
        </div>

        {loading && (
          <div style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
            <LoadingSpinner label="Loading categories from database..." />
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>📁</span>}
            title="No categories defined yet"
            description="Category trees and taxonomies will display here as they are published in the database."
          />
        )}

        {!loading && !error && categories.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/category/${cat.slug}`}
                className="card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: '1.25rem' }}>&rarr;</span>
                </div>
                {cat.description && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                    {cat.description}
                  </p>
                )}
                {cat.parentCategory && typeof cat.parentCategory === 'object' && (
                  <span className="badge badge-neutral" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                    Subcategory of {cat.parentCategory.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

