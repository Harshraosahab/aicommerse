import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProductCard } from '../components/catalog/ProductCard';
import { ProductFilter } from '../components/catalog/ProductFilter';
import { ProductSort } from '../components/catalog/ProductSort';
import { Pagination } from '../components/catalog/Pagination';
import { SearchBar } from '../components/catalog/SearchBar';
import {
  catalogApi,
  IProduct,
  ICategory,
  IBrand,
  PaginationMetadata,
} from '../services/catalogApi';
import { aiApi, SmartSearchResult } from '../services/aiApi';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search params state
  const querySearch = searchParams.get('search') || undefined;
  const queryCategory = searchParams.get('category') || undefined;
  const queryBrand = searchParams.get('brand') || undefined;
  const queryMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const queryMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const queryMinRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const queryInStock = searchParams.get('inStock') === 'true' ? true : undefined;
  const querySort = (searchParams.get('sort') as any) || 'newest';
  const queryPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;

  // Local data state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [brands, setBrands] = useState<IBrand[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [smartSearchIntent, setSmartSearchIntent] = useState<SmartSearchResult['parsedIntent'] | null>(null);

  // Fetch categories & brands for filter options once
  useEffect(() => {
    Promise.all([catalogApi.getCategories(), catalogApi.getBrands()])
      .then(([catRes, brandRes]) => {
        if (catRes.success) setCategories(catRes.data.categories);
        if (brandRes.success) setBrands(brandRes.data.brands);
      })
      .catch(() => {
        // Silently tolerate if empty
      });
  }, []);

  // Fetch products whenever search params change
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If a free-text search query is provided and no manual catalog facets are set, use Smart Search
    if (querySearch && !queryCategory && !queryBrand && !queryMinPrice && !queryMaxPrice && !queryMinRating && !queryInStock) {
      try {
        const smartRes = await aiApi.smartSearch({
          q: querySearch,
          limit: 20,
          page: queryPage,
          sort: querySort,
        });

        if (smartRes.success && smartRes.data) {
          setProducts(smartRes.data.products);
          setPagination({
            page: queryPage,
            limit: 20,
            totalItems: smartRes.data.total,
            totalPages: Math.ceil(smartRes.data.total / 20) || 1,
            hasNextPage: queryPage * 20 < smartRes.data.total,
            hasPreviousPage: queryPage > 1,
          });
          setSmartSearchIntent(smartRes.data.parsedIntent);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback gracefully to catalog search on service exception
      }
    }

    setSmartSearchIntent(null);

    try {
      const res = await catalogApi.getProducts({
        search: querySearch,
        category: queryCategory,
        brand: queryBrand,
        minPrice: queryMinPrice,
        maxPrice: queryMaxPrice,
        minRating: queryMinRating,
        inStock: queryInStock,
        sort: querySort,
        page: queryPage,
        limit: 20,
      });

      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [
    querySearch,
    queryCategory,
    queryBrand,
    queryMinPrice,
    queryMaxPrice,
    queryMinRating,
    queryInStock,
    querySort,
    queryPage,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL search parameters
  const updateFilters = (newFilters: Record<string, any>) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === undefined || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, String(val));
      }
    });

    // Reset page to 1 when changing filters
    if (!('page' in newFilters)) {
      updated.set('page', '1');
    }

    setSearchParams(updated);
  };

  const handleClearFilters = () => {
    const updated = new URLSearchParams();
    if (querySearch) updated.set('search', querySearch);
    setSearchParams(updated);
  };

  const canonicalUrl = `${window.location.origin}/products`;
  const isSearchOrFilter = Boolean(querySearch);

  return (
    <>
      <SEO
        title={querySearch ? `Search "${querySearch}" - Product Catalog` : 'Product Catalog'}
        description="Browse all products in our catalog. Dynamic data populated from MongoDB."
        canonicalUrl={canonicalUrl}
        noIndex={isSearchOrFilter}
        ogTitle={querySearch ? `Search "${querySearch}" | Nexus Commerce` : 'Product Catalog | Nexus Commerce'}
        ogDescription="Browse all products in our catalog. Dynamic data populated from MongoDB."
        ogUrl={canonicalUrl}
      />

      <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-10)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            Explore products curated with real-time inventory and dynamic pricing.
          </p>
        </div>

        {/* Top Search & Sort Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ flex: '1 1 300px', maxWidth: '500px' }}>
            <SearchBar
              initialQuery={querySearch}
              onSearch={(text) => updateFilters({ search: text })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm mobile-only"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              style={{ display: 'none' }} // Controlled via CSS media query
            >
              Filters
            </button>
            <ProductSort
              value={querySort}
              onChange={(newSort) => updateFilters({ sort: newSort })}
            />
          </div>
        </div>

        {/* Catalog Main Layout: Sidebar Filters + Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) 1fr',
            gap: 'var(--space-6)',
            alignItems: 'start',
          }}
        >
          {/* Desktop Filter Sidebar */}
          <div>
            <ProductFilter
              categories={categories}
              brands={brands}
              selectedCategory={queryCategory}
              selectedBrand={queryBrand}
              minPrice={queryMinPrice}
              maxPrice={queryMaxPrice}
              minRating={queryMinRating}
              inStock={queryInStock}
              onFilterChange={(f) => updateFilters(f)}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Product Results Grid */}
          <div>
            {/* AI Smart Search Intent Pill Banner */}
            {smartSearchIntent && (
              <div
                data-testid="smart-search-intent-banner"
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: '#1e40af',
                }}
              >
                <span>✨ <strong>Smart Search:</strong></span>
                <span>Showing results for &quot;{smartSearchIntent.cleanedQuery}&quot;</span>
                {smartSearchIntent.targetCategory && (
                  <span style={{ backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Category: {smartSearchIntent.targetCategory}
                  </span>
                )}
                {smartSearchIntent.maxPrice && (
                  <span style={{ backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Max: ₹{smartSearchIntent.maxPrice}
                  </span>
                )}
                {smartSearchIntent.attributes && Object.keys(smartSearchIntent.attributes).length > 0 && (
                  <span style={{ backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Attrs: {Object.entries(smartSearchIntent.attributes).map(([k, v]) => `${k}:${v}`).join(', ')}
                  </span>
                )}
              </div>
            )}

            {loading && (
              <div style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
                <LoadingSpinner label="Fetching products from database..." />
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <EmptyState
                icon={<span style={{ fontSize: '3rem' }}>🔍</span>}
                title="No products available"
                description={
                  querySearch || queryCategory || queryBrand
                    ? 'No products matched your specified search or filter criteria. Try clearing some filters.'
                    : 'There are currently no products in the catalog database.'
                }
                action={
                  (querySearch || queryCategory || queryBrand) && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleClearFilters}
                    >
                      Clear All Filters
                    </button>
                  )
                }
              />
            )}

            {!loading && !error && products.length > 0 && (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 'var(--space-4)',
                  }}
                >
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                <Pagination
                  metadata={pagination}
                  onPageChange={(p) => updateFilters({ page: p })}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

