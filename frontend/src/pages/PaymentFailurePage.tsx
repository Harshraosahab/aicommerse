import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { Button } from '../components/ui/Button';

export const PaymentFailurePage: React.FC = () => {
  return (
    <>
      <SEO title="Payment Incomplete" description="Your payment could not be processed." noIndex={true} />

      <div className="container" style={{ padding: 'var(--space-16) var(--space-4)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: 'var(--space-8)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto var(--space-4)',
            }}
          >
            ✕
          </div>

          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'bold', margin: '0 0 var(--space-2)' }}>
            Payment Incomplete
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)', margin: '0 0 var(--space-6)' }}>
            We could not complete your transaction. Your payment was not captured and no funds were deducted. Your items remain saved in your shopping cart.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/checkout">
              <Button variant="primary">Return to Checkout & Retry</Button>
            </Link>
            <Link to="/cart">
              <Button variant="outline">View Cart</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
