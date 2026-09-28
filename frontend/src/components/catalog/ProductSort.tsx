import React from 'react';

interface ProductSortProps {
  value: string;
  onChange: (sortValue: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'reviews' | 'discount') => void;
}

export const ProductSort: React.FC<ProductSortProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <label htmlFor="catalog-sort" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
        Sort by:
      </label>
      <select
        id="catalog-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as any)}
        style={{
          padding: 'var(--space-1) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <option value="newest">Newest Arrivals</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Highest Rated</option>
        <option value="reviews">Most Reviewed</option>
        <option value="discount">Highest Discount</option>
      </select>
    </div>
  );
};
