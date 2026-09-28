import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ShoppingAssistantWidget } from '../components/assistant/ShoppingAssistantWidget';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-root">
          {!isAdminRoute && <Header />}
          <main className={isAdminRoute ? 'admin-root' : 'main-content'} id="main-content" tabIndex={-1}>
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <LoadingSpinner size="lg" label="Loading content..." />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
          {!isAdminRoute && <ShoppingAssistantWidget />}
          {!isAdminRoute && <Footer />}
        </div>
      </CartProvider>
    </AuthProvider>
  );
};

