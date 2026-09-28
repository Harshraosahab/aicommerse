import React, { useState, Suspense } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Users,
  ShoppingCart,
  Ticket,
  Image as ImageIcon,
  Star,
  HeadphonesIcon,
  ShieldCheck,
  Settings,
  Menu,
  X,
  Store,
  LogOut,
  Sparkles,
  Bell,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navSections: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
      { label: 'AI Intelligence Hub', path: '/admin/ai', icon: <Sparkles size={18} /> },
    ],
  },
  {
    section: 'Catalog & Stock',
    items: [
      { label: 'Products', path: '/admin/products', icon: <Package size={18} /> },
      { label: 'Inventory', path: '/admin/inventory', icon: <Boxes size={18} /> },
    ],
  },
  {
    section: 'Sales & Fulfillment',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: <ShoppingBag size={18} /> },
      { label: 'Returns & Refunds', path: '/admin/returns', icon: <RotateCcw size={18} /> },
      { label: 'Payments', path: '/admin/payments', icon: <CreditCard size={18} /> },
    ],
  },
  {
    section: 'Customers & Activity',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={18} /> },
      { label: 'Abandoned Carts', path: '/admin/abandoned-carts', icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    section: 'Marketing & Support',
    items: [
      { label: 'Coupons', path: '/admin/coupons', icon: <Ticket size={18} /> },
      { label: 'Banners', path: '/admin/banners', icon: <ImageIcon size={18} /> },
      { label: 'Broadcast Notifications', path: '/admin/notifications', icon: <Bell size={18} /> },
      { label: 'Reviews', path: '/admin/reviews', icon: <Star size={18} /> },
      { label: 'Customer Support', path: '/admin/support', icon: <HeadphonesIcon size={18} /> },
      { label: 'FAQ Management', path: '/admin/faqs', icon: <HelpCircle size={18} /> },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: <ShieldCheck size={18} /> },
      { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div
      className="admin-portal-theme"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <SEO title="Admin Control Center" noIndex={true} />
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
        }}
        className="admin-sidebar"
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-base)', color: '#fff' }}>
                Apex Admin
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Management Console
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav style={{ flex: 1, padding: 'var(--space-3) 0' }}>
          {navSections.map((sec) => (
            <div key={sec.section} style={{ marginBottom: 'var(--space-3)' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  padding: 'var(--space-1) var(--space-5)',
                }}
              >
                {sec.section}
              </div>
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-5)',
                    color: isActive ? '#38bdf8' : '#cbd5e1',
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                    textDecoration: 'none',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s ease',
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: '#fff' }}>
              {user?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 500 }}>
              {user?.role || 'ADMIN'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 'var(--space-1)',
            }}
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
        className="admin-main-wrapper"
      >
        {/* Top Navbar */}
        <header
          style={{
            height: '60px',
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--space-5)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-hamburger-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Open sidebar navigation"
            >
              <Menu size={22} />
            </button>
            <span className="badge badge-primary" style={{ fontSize: '11px' }}>
              Admin Portal
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Admin Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-text)',
              }}
            >
              <span>{resolvedTheme === 'dark' ? '☀️' : '🌙'}</span>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <Store size={16} />
              <span>Back to Store</span>
            </Link>
          </div>
        </header>

        {/* Admin Content Route Outlet */}
        <main
          style={{
            flex: 1,
            padding: 'var(--space-5)',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                <LoadingSpinner size="lg" label="Loading admin module..." />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Responsive Breakpoint CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
            transform: translateX(0) !important;
          }
          .admin-main-wrapper {
            margin-left: 260px;
          }
          .mobile-hamburger-btn,
          .mobile-close-btn {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .mobile-hamburger-btn,
          .mobile-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
