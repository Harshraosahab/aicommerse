import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, isLoading, error, updateQuantity, removeFromCart, clearCart, moveCartToWishlist, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  const formatPrice = (amt: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <SEO title="Shopping Cart" description="Sign in to view your shopping cart." />
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🔒</span>}
          title="Sign in to view your cart"
          description="Your cart is tied to your account and synchronizes seamlessly across all your devices."
          action={
            <Link to="/login?redirect=/cart">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (isLoading && !cart) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Fetching your shopping cart from database..." />
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <>
      <SEO title="Shopping Cart" description="Review items selected for checkout." noIndex={true} />

      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title">Shopping Cart</h1>
            <p className="page-subtitle">
              {isEmpty ? 'Your cart is empty' : String(cart?.itemCount || 0) + ' item(s) in your cart'}
            </p>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={() => clearCart()}>
              Clear Cart
            </Button>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        {cart?.hasPriceChanges && (
          <div className="alert alert-warning" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <strong>Notice:</strong> One or more product prices have changed since they were added to your cart. Cart totals reflect current database prices.
          </div>
        )}

        {cart?.hasUnavailableItems && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <strong>Action Required:</strong> One or more items in your cart are currently unavailable or have exceeded available stock. Please adjust quantities or remove unavailable items before proceeding to checkout.
          </div>
        )}

        {isEmpty ? (
          <EmptyState
            icon={<span style={{ fontSize: '3rem' }}>🛒</span>}
            title="Your cart is currently empty"
            description="You haven't added any items to your shopping cart yet. Explore our catalog to discover products."
            action={
              <Link to="/products">
                <Button variant="primary">Explore Catalog</Button>
              </Link>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
              gap: 'var(--space-8)',
              alignItems: 'start',
            }}
          >
            {/* Cart Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {items.map((item) => (
                <div
                  key={item._id}
                  className="card"
                  style={{
                    padding: 'var(--space-4)',
                    display: 'flex',
                    gap: 'var(--space-4)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    borderLeft: !item.isAvailable ? '4px solid var(--color-danger)' : item.priceChanged ? '4px solid var(--color-warning)' : '1px solid var(--color-border)',
                  }}
                >
                  {/* Thumbnail */}
                  <Link to={'/products/' + item.slug} style={{ flexShrink: 0 }}>
                    <img
                      src={item.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10">No Image</text></svg>'}
                      alt={item.name}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}
                    />
                  </Link>

                  {/* Title & Info */}
                  <div style={{ flex: '1 1 200px' }}>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
                      <Link to={'/products/' + item.slug} style={{ color: 'var(--color-text)', textDecoration: 'none' }}>
                        {item.name}
                      </Link>
                    </h3>
                    {item.variantName && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                        Variant: <strong>{item.variantName}</strong> ({item.variantSku})
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>
                        {formatPrice(item.currentPrice)}
                      </span>
                      {item.priceChanged && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)', textDecoration: 'line-through' }}>
                          was {formatPrice(item.priceAtAddition)}
                        </span>
                      )}
                    </div>
                    {item.stockIssue && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', marginTop: 'var(--space-1)', fontWeight: 500 }}>
                        ⚠ {item.stockIssue}
                      </div>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        aria-label={'Decrease quantity of ' + item.name}
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          background: 'var(--color-surface)',
                          border: 'none',
                          color: 'var(--color-text)',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        -
                      </button>
                      <span style={{ padding: 'var(--space-1) var(--space-3)', fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={'Increase quantity of ' + item.name}
                        disabled={item.quantity >= item.stockAvailable}
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          background: 'var(--color-surface)',
                          border: 'none',
                          color: 'var(--color-text)',
                          cursor: item.quantity >= item.stockAvailable ? 'not-allowed' : 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div style={{ minWidth: '90px', textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => moveCartToWishlist(item._id)}
                      title="Save for Later"
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                      Save for Later
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeFromCart(item._id)}
                      title="Remove Item"
                      style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', margin: '0 0 var(--space-4) 0' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal ({cart?.itemCount} items)</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(cart?.subtotal || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Estimated Shipping</span>
                  <span style={{ color: (cart?.subtotal || 0) >= 100 ? 'var(--color-success)' : 'var(--color-text)' }}>
                    {(cart?.subtotal || 0) >= 100 ? 'FREE (Over $100)' : formatPrice(10.0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Estimated Tax</span>
                  <span style={{ color: 'var(--color-text-subtle)' }}>Calculated at checkout</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0', paddingTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>Estimated Total</span>
                  <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {formatPrice((cart?.subtotal || 0) + ((cart?.subtotal || 0) > 0 && (cart?.subtotal || 0) < 100 ? 10.0 : 0))}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                disabled={cart?.hasUnavailableItems || isEmpty}
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', padding: 'var(--space-3)' }}
              >
                {cart?.hasUnavailableItems ? 'Resolve Issues to Checkout' : 'Proceed to Checkout →'}
              </Button>

              <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
                🔒 Safe, encrypted checkout. Powered by MongoDB.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
