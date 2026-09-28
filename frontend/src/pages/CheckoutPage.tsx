import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { cartApi, CheckoutSummaryResult } from '../services/cartApi';
import { authApi, IUserAddress } from '../services/authApi';
import { orderApi } from '../services/orderApi';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { cart, refreshCart } = useCart();

  const [summary, setSummary] = useState<CheckoutSummaryResult | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // New Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');
  const [isDefault, setIsDefault] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Selected payment method preview
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'COD'>('CARD');

  const fetchSummary = async (addrId?: string) => {
    setLoading(true);
    setSummaryError(null);
    try {
      const res = await cartApi.getCheckoutSummary(addrId);
      if (res.success) {
        setSummary(res.data);
        if (res.data.selectedAddress && !addrId) {
          setSelectedAddressId(res.data.selectedAddress._id);
        }
      }
    } catch (err: any) {
      setSummaryError(err.message || 'Unable to load checkout summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary(selectedAddressId);
    }
  }, [isAuthenticated, selectedAddressId]);

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    fetchSummary(id);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSubmitting(true);
    setAddressError(null);
    try {
      const res = await authApi.addAddress({
        street,
        city,
        state: stateName,
        postalCode: zipCode,
        country,
        isDefault,
      });
      if (res.success) {
        await refreshUser();
        setShowAddressForm(false);
        setStreet('');
        setCity('');
        setStateName('');
        setZipCode('');
        // Select the newly created address
        const addresses = res.data.addresses;
        const newAddr = addresses[addresses.length - 1];
        if (newAddr?._id) {
          handleSelectAddress(newAddr._id);
        }
      }
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !summary?.isReady) return;

    setSubmittingOrder(true);
    setOrderError(null);
    setConfigNotice(null);

    try {
      const res = await orderApi.initiateOrder({
        addressId: selectedAddressId,
        paymentMethod,
      });

      if (res.success) {
        const order = res.data.order;

        if (paymentMethod === 'COD') {
          await refreshCart();
          navigate(`/order-success/${order._id}`);
          return;
        }

        // Online Payment Handling
        const paymentPayload = res.data.paymentPayload;
        if (paymentPayload && (window as any).Razorpay) {
          const options = {
            key: paymentPayload.keyId,
            amount: paymentPayload.amount,
            currency: paymentPayload.currency,
            name: 'AI Commerce Platform',
            description: `Order ${order.orderNumber}`,
            order_id: paymentPayload.providerOrderId,
            handler: async (response: any) => {
              try {
                const verifyRes = await orderApi.verifyPayment({
                  orderId: order._id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });
                if (verifyRes.success) {
                  await refreshCart();
                  navigate(`/order-success/${order._id}`);
                }
              } catch (verifyErr: any) {
                setOrderError(verifyErr.message || 'Payment verification failed');
              }
            },
            prefill: {
              name: user?.name,
              email: user?.email,
            },
            theme: {
              color: '#2563eb',
            },
            modal: {
              ondismiss: () => {
                setOrderError('Payment was cancelled or closed. Your items remain safe in your cart.');
              },
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          setOrderError('Razorpay checkout SDK is not loaded. Please select Cash on Delivery (COD) to place order directly.');
        }
      }
    } catch (err: any) {
      if (err.code === 'CONFIGURATION_REQUIRED' || err.statusCode === 503) {
        setConfigNotice(
          'Online payment gateway keys (RAZORPAY_KEY_ID / SECRET) are not configured on the backend. Please select Cash on Delivery (COD) to place your real order.'
        );
      } else {
        setOrderError(err.message || 'Failed to place order. Please review your cart and try again.');
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  const formatPrice = (amt: number) => formatCurrency(amt);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <SEO title="Secure Checkout" description="Sign in to complete checkout." />
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🔒</span>}
          title="Sign in to proceed with checkout"
          description="A verified customer account is required to safely validate delivery addresses and calculate order totals."
          action={
            <Link to="/login?redirect=/checkout">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <SEO title="Secure Checkout" description="Your cart is currently empty." />
        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>🛒</span>}
          title="Your cart is empty"
          description="You cannot proceed to checkout without any items in your shopping cart."
          action={
            <Link to="/products">
              <Button variant="primary">Explore Catalog</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="container" style={{ padding: 'var(--space-12) 0', textAlign: 'center' }}>
        <LoadingSpinner label="Validating stock and preparing checkout summary..." />
      </div>
    );
  }

  const savedAddresses: IUserAddress[] = user?.addresses || [];

  return (
    <>
      <SEO title="Secure Checkout" description="Complete delivery address and review order summary." noIndex={true} />

      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Checkout Preparation</h1>
          <p className="page-subtitle">Verify delivery details and review real-time order pricing.</p>
        </div>

        {summaryError && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {summaryError}
          </div>
        )}

        {/* Readiness Warnings */}
        {summary && summary.issues.length > 0 && (
          <div className="alert alert-warning" role="alert" style={{ marginBottom: 'var(--space-6)' }}>
            <strong style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Attention Required Before Payment:</strong>
            <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
              {summary.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
        >
          {/* Main Column: Address & Payment Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Step 1: Delivery Address */}
            <section className="card" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                  1. Delivery Address
                </h2>
                {!showAddressForm && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
                    + Add New Address
                  </Button>
                )}
              </div>

              {/* Saved Address Radios */}
              {savedAddresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <label
                        key={addr._id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3) var(--space-4)',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => addr._id && handleSelectAddress(addr._id)}
                          style={{ marginTop: 'var(--space-1)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                            {addr.street}
                            {addr.isDefault && (
                              <span className="badge badge-neutral" style={{ marginLeft: 'var(--space-2)' }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                            {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                  No saved addresses found. Please add a delivery address below.
                </p>
              )}

              {/* Add New Address Form Modal/Drawer Inline */}
              {showAddressForm && (
                <form
                  onSubmit={handleAddAddress}
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', margin: '0 0 var(--space-3) 0' }}>
                    New Shipping Address
                  </h3>

                  {addressError && (
                    <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
                      {addressError}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="123 Market St, Suite 400"
                        style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="San Francisco"
                          style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                          State / Region *
                        </label>
                        <input
                          type="text"
                          required
                          value={stateName}
                          onChange={(e) => setStateName(e.target.value)}
                          placeholder="CA"
                          style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                          Zip / Postal Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="94103"
                          style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                          Country *
                        </label>
                        <input
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="US"
                          style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                        />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                      />
                      Set as default delivery address
                    </label>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Button variant="primary" size="sm" type="submit" disabled={addressSubmitting}>
                        {addressSubmitting ? 'Saving...' : 'Save & Deliver Here'}
                      </Button>
                      <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddressForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </section>

            {/* Step 2: Payment Selection (Phase 5 Architecture Foundation) */}
            <section className="card" style={{ padding: 'var(--space-6)' }}>
              <h2 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                2. Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'CARD' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'CARD' ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Credit / Debit Card</span>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Visa, Mastercard, American Express
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'UPI' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'UPI' ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>UPI / NetBanking</span>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Instant payment via UPI apps & bank accounts
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: paymentMethod === 'COD' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: paymentMethod === 'COD' ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Cash on Delivery</span>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Pay with cash or card upon delivery
                    </div>
                  </div>
                </label>
              </div>

              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                }}
              >
                ℹ <strong>Phase 5 Note:</strong> Payment gateway processing and order placement will be fully activated in <strong>Phase 6: Orders & Payments</strong>.
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Readiness */}
          <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'var(--space-4)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold', margin: '0 0 var(--space-4) 0' }}>
              Order Review
            </h2>

            {/* Items review snippet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', maxHeight: '200px', overflowY: 'auto' }}>
              {summary?.items.map((item) => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>
                      Qty: {item.quantity} {item.variantSku && ' • ' + item.variantSku}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatPrice(item.lineTotal)}</div>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(summary?.subtotal || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Shipping</span>
                <span style={{ color: (summary?.shippingFee || 0) === 0 ? 'var(--color-success)' : 'var(--color-text)' }}>
                  {(summary?.shippingFee || 0) === 0 ? 'FREE' : formatPrice(summary?.shippingFee || 0)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Estimated Tax</span>
                <span style={{ color: 'var(--color-text-subtle)' }}>
                  {formatPrice(summary?.tax || 0)}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0', paddingTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>Total Amount</span>
                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {formatPrice(summary?.total || 0)}
                </span>
              </div>
            </div>

            {/* Order Notices */}
            {configNotice && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-bg-subtle, #eff6ff)',
                  border: '1px solid #3b82f6',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: '#1e40af',
                }}
              >
                ℹ {configNotice}
              </div>
            )}

            {orderError && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: '#991b1b',
                }}
              >
                ⚠ {orderError}
              </div>
            )}

            {/* Order Placement Action */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              {summary?.isReady ? (
                <div>
                  <div className="badge badge-success" style={{ width: '100%', textAlign: 'center', padding: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    ✓ Ready for Order Placement
                  </div>
                  <Button
                    variant="primary"
                    disabled={submittingOrder}
                    onClick={handlePlaceOrder}
                    style={{ width: '100%', padding: 'var(--space-3)', fontWeight: 'bold' }}
                  >
                    {submittingOrder
                      ? 'Processing Order...'
                      : paymentMethod === 'COD'
                      ? 'Place Order (Cash on Delivery)'
                      : `Pay ${formatPrice(summary.total)}`}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="badge badge-warning" style={{ width: '100%', textAlign: 'center', padding: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    ⚠ Delivery Address Required
                  </div>
                  <Button
                    variant="outline"
                    disabled
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  >
                    Select or Add Delivery Address Above
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
