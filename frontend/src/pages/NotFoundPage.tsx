import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <>
      <SEO title="Page Not Found (404)" description="The requested page could not be located." noIndex={true} />

      <div className="container" style={{ padding: 'var(--space-12) 0' }}>
        <EmptyState
          icon={<span style={{ fontSize: '3.5rem' }}>404</span>}
          title="Page Not Found"
          description="The resource or route you requested does not exist on this server. Please verify the URL or return to the home page."
          action={
            <Link to="/">
              <Button variant="primary">Return Home</Button>
            </Link>
          }
        />
      </div>
    </>
  );
};
