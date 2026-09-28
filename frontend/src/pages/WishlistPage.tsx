import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const WishlistPage: React.FC = () => {
  const { wishlist, isLoading, error, removeFromWishlist, moveWishlistToCart, clearWishlist, refreshWishlist } = useCart();
  const { isAuthenticated } = useAuth();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist]);

  const formatPrice = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <SEO title="Saved Wishlist" description="Sign in to view your wishlist." />
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🔒</span>}
          title="Sign in to view your wishlist"
          description="Your saved wishlist items synchronize across all your devices once you sign in."
          action={
            <Link to="/login?redirect=/wishlist">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading && !wishlist) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Fetching your saved items from database..." />
      </div>
    );
  }

  const items = wishlist?.items || [];
  const isEmpty = items.length === 0;

  return (
    <>
      <SEO title="Saved Wishlist" description="Items saved for future consideration." noIndex={true} />

      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title">Saved Wishlist</h1>
            <p className="page-subtitle">
              {isEmpty ? 'Your wishlist is empty' : String(items.length) + ' saved item(s)'}
            </p>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={() => clearWishlist()}>
              Clear Wishlist
            </Button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {successMessage}
          </div>
        )}

        {isEmpty ? (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>♡</span>}
            title="Your wishlist is empty"
            description="You haven't saved any items yet. Browse products and tap 'Save' to track items you love."
            action={
              <Link to="/products">
                <Button variant="primary">Browse Products</Button>
              </Link>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-6)',
              alignItems: 'start',
            }}
          >
            {items.map((item) => (
              <div
                key={item._id || item.productId}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Thumbnail */}
                <Link to={'/products/' + item.slug} style={{ display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: 'var(--color-surface)' }}>
                  <img
                    src={item.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16">No Image</text></svg>'}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Link>

                <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 'var(--space-2)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
                    <Link to={'/products/' + item.slug} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                      {item.name}
                    </Link>
                  </h3>

                  {item.variantName && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Variant: <strong>{item.variantName}</strong>
                    </div>
                  )}

                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                    {formatPrice(item.currentPrice)}
                  </div>

                  <div>
                    {item.isAvailable ? (
                      <span className="badge badge-success">In Stock</span>
                    ) : (
                      <span className="badge badge-danger">Out of Stock</span>
                    )}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!item.isAvailable || movingId === item._id}
                      onClick={async () => {
                        setMovingId(item._id);
                        setSuccessMessage(null);
                        try {
                          await moveWishlistToCart(item.productId, item.variantSku);
                          setSuccessMessage('Moved "' + item.name + '" to your cart!');
                        } catch {
                          // Handled in context
                        } finally {
                          setMovingId(null);
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      {movingId === item._id ? 'Moving...' : 'Add to Cart 🛒'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWishlist(item.productId, item.variantSku)}
                      title="Remove from wishlist"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
