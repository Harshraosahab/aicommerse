import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Dynamic code splitting helper for named exports
const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  factory: () => Promise<T>,
  name: K
) => React.lazy(() => factory().then((mod) => ({ default: mod[name] })));

// Customer / Catalog Pages
const ProductsPage = lazyNamed(() => import('../pages/ProductsPage'), 'ProductsPage');
const ProductDetailPage = lazyNamed(() => import('../pages/ProductDetailPage'), 'ProductDetailPage');
const CategoriesPage = lazyNamed(() => import('../pages/CategoriesPage'), 'CategoriesPage');
const CategoryDetailPage = lazyNamed(() => import('../pages/CategoryDetailPage'), 'CategoryDetailPage');
const BrandDetailPage = lazyNamed(() => import('../pages/BrandDetailPage'), 'BrandDetailPage');
const CartPage = lazyNamed(() => import('../pages/CartPage'), 'CartPage');
const WishlistPage = lazyNamed(() => import('../pages/WishlistPage'), 'WishlistPage');
const CheckoutPage = lazyNamed(() => import('../pages/CheckoutPage'), 'CheckoutPage');
const OrdersPage = lazyNamed(() => import('../pages/OrdersPage'), 'OrdersPage');
const OrderDetailPage = lazyNamed(() => import('../pages/OrderDetailPage'), 'OrderDetailPage');
const OrderSuccessPage = lazyNamed(() => import('../pages/OrderSuccessPage'), 'OrderSuccessPage');
const PaymentFailurePage = lazyNamed(() => import('../pages/PaymentFailurePage'), 'PaymentFailurePage');
const ProfilePage = lazyNamed(() => import('../pages/ProfilePage'), 'ProfilePage');

// Auth Pages
const LoginPage = lazyNamed(() => import('../pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('../pages/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('../pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage');

// Notification & Support Pages
const NotificationsPage = lazyNamed(() => import('../pages/NotificationsPage'), 'NotificationsPage');
const NotificationPreferencesPage = lazyNamed(() => import('../pages/NotificationPreferencesPage'), 'NotificationPreferencesPage');
const SupportPage = lazyNamed(() => import('../pages/SupportPage'), 'SupportPage');
const NewSupportTicketPage = lazyNamed(() => import('../pages/NewSupportTicketPage'), 'NewSupportTicketPage');
const SupportTicketDetailPage = lazyNamed(() => import('../pages/SupportTicketDetailPage'), 'SupportTicketDetailPage');
const HelpCenterPage = lazyNamed(() => import('../pages/HelpCenterPage'), 'HelpCenterPage');
const FAQDetailPage = lazyNamed(() => import('../pages/FAQDetailPage'), 'FAQDetailPage');

// Admin Layout & Administration Modules
const AdminLayout = lazyNamed(() => import('../layouts/AdminLayout'), 'AdminLayout');
const AdminDashboardPage = lazyNamed(() => import('../pages/AdminDashboardPage'), 'AdminDashboardPage');
const AdminProductsPage = lazyNamed(() => import('../pages/AdminProductsPage'), 'AdminProductsPage');
const AdminOrdersPage = lazyNamed(() => import('../pages/AdminOrdersPage'), 'AdminOrdersPage');
const AdminUsersPage = lazyNamed(() => import('../pages/AdminUsersPage'), 'AdminUsersPage');
const AdminInventoryPage = lazyNamed(() => import('../pages/AdminInventoryPage'), 'AdminInventoryPage');
const AdminReturnsRefundsPage = lazyNamed(() => import('../pages/AdminReturnsRefundsPage'), 'AdminReturnsRefundsPage');
const AdminPaymentsPage = lazyNamed(() => import('../pages/AdminPaymentsPage'), 'AdminPaymentsPage');
const AdminReviewsPage = lazyNamed(() => import('../pages/AdminReviewsPage'), 'AdminReviewsPage');
const AdminCouponsPage = lazyNamed(() => import('../pages/AdminCouponsPage'), 'AdminCouponsPage');
const AdminSupportPage = lazyNamed(() => import('../pages/AdminSupportPage'), 'AdminSupportPage');
const AdminAuditLogsPage = lazyNamed(() => import('../pages/AdminAuditLogsPage'), 'AdminAuditLogsPage');
const AdminAbandonedCartsPage = lazyNamed(() => import('../pages/AdminAbandonedCartsPage'), 'AdminAbandonedCartsPage');
const AdminSettingsPage = lazyNamed(() => import('../pages/AdminSettingsPage'), 'AdminSettingsPage');
const AdminAIInsightsPage = lazyNamed(() => import('../pages/AdminAIInsightsPage'), 'AdminAIInsightsPage');
const AdminFAQPage = lazyNamed(() => import('../pages/AdminFAQPage'), 'AdminFAQPage');
const AdminNotificationsPage = lazyNamed(() => import('../pages/AdminNotificationsPage'), 'AdminNotificationsPage');

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'category/:slug', element: <CategoryDetailPage /> },
      { path: 'brand/:slug', element: <BrandDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      {
        path: 'orders',
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'order-success/:orderId',
        element: (
          <ProtectedRoute>
            <OrderSuccessPage />
          </ProtectedRoute>
        ),
      },
      { path: 'payment-failure', element: <PaymentFailurePage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications/preferences',
        element: (
          <ProtectedRoute>
            <NotificationPreferencesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support/new',
        element: (
          <ProtectedRoute>
            <NewSupportTicketPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'support/tickets/:ticketId',
        element: (
          <ProtectedRoute>
            <SupportTicketDetailPage />
          </ProtectedRoute>
        ),
      },
      { path: 'help', element: <HelpCenterPage /> },
      { path: 'help/:slug', element: <FAQDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password/:token', element: <ResetPasswordPage /> },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'returns', element: <AdminReturnsRefundsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'reviews', element: <AdminReviewsPage /> },
          { path: 'coupons', element: <AdminCouponsPage /> },
          { path: 'support', element: <AdminSupportPage /> },
          { path: 'faqs', element: <AdminFAQPage /> },
          { path: 'notifications', element: <AdminNotificationsPage /> },
          { path: 'audit-logs', element: <AdminAuditLogsPage /> },
          { path: 'abandoned-carts', element: <AdminAbandonedCartsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'analytics', element: <AdminDashboardPage /> },
          { path: 'ai', element: <AdminAIInsightsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);


