import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
              Nexus Commerce
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-xs)' }}>
              Production-Ready AI-Powered E-Commerce Platform &bull; Phase 1 Architecture
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}>
            <Link to="/products">Catalog</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/admin">Admin Portal</Link>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-subtle)' }}>
            &copy; {new Date().getFullYear()} Nexus Commerce Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
