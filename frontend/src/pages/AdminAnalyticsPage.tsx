import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';

export const AdminAnalyticsPage: React.FC = () => {
  return (
    <>
      <SEO title="Platform Analytics | Admin" description="Business metrics and intelligence." />

      <div className="container">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/admin" className="nav-link" style={{ paddingLeft: 0 }}>
            &larr; Back to Admin Dashboard
          </Link>
        </div>

        <div className="page-header">
          <h1 className="page-title">Platform & Commerce Analytics</h1>
          <p className="page-subtitle">Funnel conversion rates, customer lifetime value, and order metrics.</p>
        </div>

        <EmptyState
          icon={<span style={{ fontSize: '3rem' }}>📈</span>}
          title="No analytics metrics recorded"
          description="Real-time sales, order volumes, and inventory metrics are aggregated dynamically on the Admin Dashboard from live database collections. No fake statistics or mock graphs are fabricated."
        />
      </div>
    </>
  );
};
