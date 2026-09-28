import React from 'react';
import { ICategory, IBrand } from '../../services/catalogApi';
import { Button } from '../ui/Button';

interface ProductFilterProps {
  categories: ICategory[];
  brands: IBrand[];
  selectedCategory?: string;
  selectedBrand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onFilterChange: (filters: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
  }) => void;
  onClearFilters: () => void;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  categories = [],
  brands = [],
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  minRating,
  inStock,
  onFilterChange,
  onClearFilters,
}) => {
  const hasActiveFilters = Boolean(
    selectedCategory || selectedBrand || minPrice !== undefined || maxPrice !== undefined || minRating !== undefined || inStock !== undefined
  );

  return (
    <aside aria-label="Catalog Filters" className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', margin: 0 }}>Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div>
          <label htmlFor="filter-category" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Category
          </label>
          <select
            id="filter-category"
            value={selectedCategory || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Brands Filter */}
      {brands.length > 0 && (
        <div>
          <label htmlFor="filter-brand" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: 'var(--space-1)' }}>
            Brand
          </label>
          <select
            id="filter-brand"
            value={selectedBrand || ''}
            onChange={(e) => onFilterChange({ brand: e.target.value || undefined })}
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price Range Filter */}
      <div>
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: 'var(--space-1)' }}>
          Price Range ($)
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
          <input
            type="number"
            min="0"
            placeholder="Min"
            aria-label="Minimum Price"
            value={minPrice !== undefined ? minPrice : ''}
            onChange={(e) =>
              onFilterChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            aria-label="Maximum Price"
            value={maxPrice !== undefined ? maxPrice : ''}
            onChange={(e) =>
              onFilterChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            style={{
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <label htmlFor="filter-rating" style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-subtle)', display: 'block', marginBottom: 'var(--space-1)' }}>
          Minimum Rating
        </label>
        <select
          id="filter-rating"
          value={minRating !== undefined ? String(minRating) : ''}
          onChange={(e) =>
            onFilterChange({
              minRating: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          style={{
            width: '100%',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">Any Rating</option>
          <option value="4">★ 4 Stars & Above</option>
          <option value="3">★ 3 Stars & Above</option>
          <option value="2">★ 2 Stars & Above</option>
        </select>
      </div>

      {/* Stock Availability Toggle */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!inStock}
            onChange={(e) =>
              onFilterChange({
                inStock: e.target.checked ? true : undefined,
              })
            }
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </aside>
  );
};
