import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/catalog/ProductCard';
import { catalogApi, IProduct, IProductVariant } from '../services/catalogApi';
import { recommendationApi } from '../services/recommendationApi';
import { RecommendationSection } from '../components/recommendations/RecommendationSection';
import { ReviewSummaryCard } from '../components/reviews/ReviewSummaryCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { generateProductSchema, generateBreadcrumbSchema } from '../utils/structuredData';

export const ProductDetailPage: React.FC = () => {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, addToWishlist } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    Promise.all([
      catalogApi.getProductBySlug(slug),
      catalogApi.getRelatedProducts(slug),
    ])
      .then(([prodRes, relRes]) => {
        if (prodRes.success && prodRes.data?.product) {
          const p = prodRes.data.product;
          setProduct(p);
          if (p.variants && p.variants.length > 0) {
            setSelectedVariant(p.variants[0]);
          } else {
            setSelectedVariant(null);
          }
          setActiveImageIndex(0);

          // Track genuine product VIEW telemetry
          recommendationApi.trackInteraction({
            action: 'VIEW',
            productId: p._id,
            metadata: { source: 'product_detail', slug },
          }).catch(() => {});
        }
        if (relRes.success && relRes.data?.products) {
          setRelatedProducts(relRes.data.products);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Product not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Loading product details..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🏷️</span>}
          title="Product Not Found"
          description={error || 'The requested product could not be located in our catalog.'}
          action={
            <Link to="/products">
              <Button variant="outline">Browse Catalog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Active pricing and stock from selected variant or parent product
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const activeSKU = selectedVariant ? selectedVariant.sku : product.SKU;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const images = product.images.length > 0 ? product.images : [{ url: '', alt: product.name }];
  const currentImage = images[activeImageIndex] || images[0];

  // Stock status logic
  const getStockBadge = () => {
    if (activeStock <= 0) {
      return <span className="badge badge-danger">Out of Stock</span>;
    }
    if (activeStock <= 5) {
      return <span className="badge badge-warning">Limited Stock ({activeStock} remaining)</span>;
    }
    return <span className="badge badge-success">In Stock</span>;
  };

  // SEO & Structured Data (JSON-LD)
  const canonicalUrl = `${window.location.origin}/products/${product.slug}`;
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Catalog', url: '/products' },
    ...(product.category ? [{ name: product.category.name, url: `/category/${product.category.slug}` }] : []),
    { name: product.name, url: `/products/${product.slug}` },
  ];
  const productSchema = generateProductSchema(product);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <SEO
        title={`${product.name} - ${product.brand?.name || 'Nexus Commerce'}`}
        description={product.shortDescription || product.description.slice(0, 160)}
        canonicalUrl={canonicalUrl}
        ogType="product"
        ogTitle={product.name}
        ogDescription={product.shortDescription || product.description.slice(0, 160)}
        ogImage={currentImage.url}
        ogUrl={canonicalUrl}
        twitterTitle={product.name}
        twitterDescription={product.shortDescription || product.description.slice(0, 160)}
        twitterImage={currentImage.url}
        schema={[productSchema, breadcrumbSchema]}
      />

      <div className="container" style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          <Link to="/" style={{ color: 'inherit' }}>Home</Link> /{' '}
          <Link to="/products" style={{ color: 'inherit' }}>Catalog</Link> /{' '}
          {product.category && (
            <>
              <Link to={`/category/${product.category.slug}`} style={{ color: 'inherit' }}>
                {product.category.name}
              </Link>{' '}
              /{' '}
            </>
          )}
          <span style={{ color: 'var(--color-text)' }}>{product.name}</span>
        </nav>

        {/* Product Details Section: Gallery + Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Image Gallery */}
          <div>
            {/* Main Stage Image with explicit dimensions for CLS prevention */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <img
                src={currentImage.url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">No Image</text></svg>'}
                alt={currentImage.alt || product.name}
                width={600}
                height={600}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: activeImageIndex === idx ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      padding: 0,
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-surface)',
                      flexShrink: 0,
                    }}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Thumbnail ${idx + 1}`}
                      width={64}
                      height={64}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Brand */}
            {product.brand && (
              <div>
                <Link
                  to={`/brand/${product.brand.slug}`}
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--color-primary)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {product.brand.name}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', margin: 0, fontWeight: 'bold' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>★ {product.rating.toFixed(1)}</span>
              <span style={{ color: 'var(--color-text-subtle)' }}>({product.reviewCount} customer reviews)</span>
              <span style={{ margin: '0 var(--space-1)', color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-text-subtle)' }}>SKU: <strong>{activeSKU}</strong></span>
            </div>

            {/* Pricing Section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', margin: 'var(--space-2) 0' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text)' }}>
                {formatPrice(activePrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > activePrice && (
                <span style={{ fontSize: 'var(--font-size-base)', textDecoration: 'line-through', color: 'var(--color-text-subtle)' }}>
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              {product.discount > 0 && (
                <span className="badge badge-danger">Save {product.discount}%</span>
              )}
            </div>

            {/* Stock State */}
            <div>{getStockBadge()}</div>

            {/* Short Description */}
            {product.shortDescription && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', lineHeight: 1.5, margin: 'var(--space-2) 0' }}>
                {product.shortDescription}
              </p>
            )}

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: 'var(--space-2)' }}>
                  Select Option:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {product.variants.map((v, i) => {
                    const isSelected = selectedVariant?.sku === v.sku;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        disabled={v.stock <= 0}
                        style={{
                          padding: 'var(--space-2) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                          color: isSelected ? 'var(--color-primary-contrast)' : 'var(--color-text)',
                          cursor: v.stock <= 0 ? 'not-allowed' : 'pointer',
                          opacity: v.stock <= 0 ? 0.5 : 1,
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {v.name} ({formatPrice(v.price)}) {v.stock <= 0 ? ' - Out of Stock' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Feedback Alerts */}
            {actionSuccess && (
              <div className="alert alert-success" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                {actionError}
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || activeStock <= 0}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-surface)',
                      border: 'none',
                      color: 'var(--color-text)',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    -
                  </button>
                  <span style={{ padding: 'var(--space-2) var(--space-4)', fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                    disabled={quantity >= activeStock || activeStock <= 0}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-surface)',
                      border: 'none',
                      color: 'var(--color-text)',
                      cursor: quantity >= activeStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <Button
                  variant="primary"
                  disabled={activeStock <= 0 || actionLoading}
                  onClick={async () => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                      return;
                    }
                    setActionLoading(true);
                    setActionSuccess(null);
                    setActionError(null);
                    try {
                      await addToCart(product._id, selectedVariant?.sku, quantity);
                      recommendationApi.trackInteraction({
                        action: 'ADD_TO_CART',
                        productId: product._id,
                        metadata: { variantSku: selectedVariant?.sku, quantity },
                      }).catch(() => {});
                      setActionSuccess(`Added ${quantity} unit(s) of "${product.name}" to your cart!`);
                    } catch (err: any) {
                      setActionError(err.message || 'Unable to add item to cart');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  {actionLoading ? 'Adding...' : activeStock > 0 ? 'Add to Cart 🛒' : 'Out of Stock'}
                </Button>

                <Button
                  variant="outline"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                      return;
                    }
                    setActionLoading(true);
                    setActionSuccess(null);
                    setActionError(null);
                    try {
                      await addToWishlist(product._id, selectedVariant?.sku);
                      recommendationApi.trackInteraction({
                        action: 'WISHLIST',
                        productId: product._id,
                        metadata: { variantSku: selectedVariant?.sku },
                      }).catch(() => {});
                      setActionSuccess(`Saved "${product.name}" to your wishlist!`);
                    } catch (err: any) {
                      setActionError(err.message || 'Unable to add to wishlist');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  title="Save to Wishlist"
                >
                  ♡ Save
                </Button>
              </div>
            </div>

            {/* Specifications */}
            {product.specifications && product.specifications.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                  Specifications
                </h2>
                <div className="table-container">
                  <table className="table" style={{ width: '100%' }}>
                    <tbody>
                      {product.specifications.map((spec, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, width: '40%' }}>{spec.name}</td>
                          <td>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Description */}
        <div style={{ marginTop: 'var(--space-10)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
            Product Description
          </h2>
          <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 'var(--space-6)' }}>
            {product.description}
          </div>

          {/* AI Customer Review Aspect Highlights */}
          <ReviewSummaryCard productId={product._id} />
        </div>

        {/* Database Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: 'var(--space-12)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>
              Related Products in this Category
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          </div>
        )}

        {/* AI-Powered Similar Products Recommendation Engine */}
        {product && (
          <div style={{ marginTop: 'var(--space-10)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-8)' }}>
            <RecommendationSection
              title="AI Similar Products"
              subtitle="Curated by content, style, brand, and feature similarity"
              type="similar"
              productId={product._id}
              limit={4}
            />
          </div>
        )}
      </div>
    </>
  );
};

