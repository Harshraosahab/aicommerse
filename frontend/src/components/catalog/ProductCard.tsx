import React from 'react';
import { Link } from 'react-router-dom';
import { IProduct } from '../../services/catalogApi';

interface ProductCardProps {
  product: IProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const placeholderImage = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16">No Image</text></svg>';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Stock status logic
  const getStockBadge = () => {
    if (product.stock <= 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    }
    if (product.stock <= 5) {
      return <span className="badge badge-warning">Low Stock ({product.stock} left)</span>;
    }
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        position: 'relative',
      }}
    >
      {/* Badges container */}
      <div
        style={{
          position: 'absolute',
          top: 'var(--space-2)',
          left: 'var(--space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          zIndex: 2,
        }}
      >
        {product.isNewArrival && <span className="badge badge-success">New</span>}
        {product.isBestseller && <span className="badge badge-warning">Bestseller</span>}
        {product.isFeatured && <span className="badge badge-neutral">Featured</span>}
        {product.discount > 0 && <span className="badge badge-danger">-{product.discount}%</span>}
      </div>

      {/* Product Image */}
      <Link
        to={`/products/${product.slug}`}
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface)',
          position: 'relative',
        }}
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={primaryImage?.url || placeholderImage}
          alt={primaryImage?.alt || product.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform var(--transition-normal)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
      </Link>

      {/* Card Content */}
      <div
        className="card-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          padding: 'var(--space-4)',
          gap: 'var(--space-2)',
        }}
      >
        {/* Brand & Category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {product.brand ? (
            <Link to={`/brand/${product.brand.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.brand.name}
            </Link>
          ) : (
            <span>Generic</span>
          )}
          {product.category && (
            <Link to={`/category/${product.category.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.category.name}
            </Link>
          )}
        </div>

        {/* Product Title */}
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', lineHeight: 1.3 }}>
          <Link
            to={`/products/${product.slug}`}
            style={{
              color: 'var(--color-text)',
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </Link>
        </h3>

        {/* Rating and review count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>★ {product.rating.toFixed(1)}</span>
          <span style={{ color: 'var(--color-text-subtle)' }}>({product.reviewCount})</span>
        </div>

        {/* Pricing & Stock */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: 'var(--font-size-sm)', textDecoration: 'line-through', color: 'var(--color-text-subtle)' }}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <div style={{ marginTop: 'var(--space-2)' }}>
            {getStockBadge()}
          </div>
        </div>
      </div>
    </div>
  );
};
