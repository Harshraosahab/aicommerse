import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?:
    | 'USER'
    | 'ADMIN'
    | 'SUPER_ADMIN'
    | 'PRODUCT_MANAGER'
    | 'ORDER_MANAGER'
    | 'SUPPORT_MANAGER'
    | 'MARKETING_MANAGER'
    | 'MODERATOR';
}

const ADMIN_ROLES = [
  'ADMIN',
  'SUPER_ADMIN',
  'PRODUCT_MANAGER',
  'ORDER_MANAGER',
  'SUPPORT_MANAGER',
  'MARKETING_MANAGER',
  'MODERATOR',
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" role="status" aria-label="Loading authentication status"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  if (requiredRole) {
    const hasAdminAccess = ADMIN_ROLES.includes(user.role);
    if (requiredRole === 'ADMIN' && !hasAdminAccess) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-sm text-red-600">You do not have administrative permissions to view this page.</p>
        </div>
      );
    }
    if (requiredRole !== 'ADMIN' && user.role !== requiredRole && !hasAdminAccess) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
          <p className="text-sm text-red-600">You do not have the required permissions to view this page.</p>
        </div>
      );
    }
  }

  return children;
};
