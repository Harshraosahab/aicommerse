import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { healthService } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { notificationApi, NotificationItem } from '../../services/notificationApi';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'degraded' | 'offline'>('checking');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Fetch unread count for notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        if (isMounted) setUnreadCount(count);

        const data = await notificationApi.getNotifications({ limit: 5 });
        if (isMounted) setRecentNotifications(data.notifications);
      } catch {
        // Silently handle if unauthenticated or network error
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s polling for live updates
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Periodic API health check for header indicator
  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const res = await healthService.checkBackendHealth();
        if (mounted) {
          setApiStatus(res.data.status === 'ok' ? 'online' : 'degraded');
        }
      } catch {
        if (mounted) {
          setApiStatus('offline');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Catalog', path: '/products' },
    { label: 'Categories', path: '/categories' },
    { label: 'Orders', path: '/orders' },
    { label: 'Support', path: '/support' },
    { label: 'Help', path: '/help' },
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <header className="site-header" role="banner">
      <div className="container">
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="brand-logo" aria-label="Nexus Commerce Home">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#3B82F6" />
              <path d="M8 10L16 6L24 10V22L16 26L8 22V10Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <path d="M16 6V26M8 10L24 22M24 10L8 22" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
            </svg>
            <span>Nexus Commerce</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-menu-desktop" aria-label="Primary Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="header-actions">
            {/* Live API Health Indicator Pill */}
            <span
              className={`badge ${
                apiStatus === 'online'
                  ? 'badge-success'
                  : apiStatus === 'degraded'
                  ? 'badge-warning'
                  : apiStatus === 'offline'
                  ? 'badge-danger'
                  : 'badge-neutral'
              }`}
              title={`Backend API Status: ${apiStatus}`}
              aria-label={`Backend API Status: ${apiStatus}`}
            >
              API: {apiStatus}
            </span>

            {/* Notification Bell & Dropdown */}
            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="btn btn-ghost btn-sm"
                  aria-label={`Notifications (${unreadCount} unread)`}
                  title="Notifications"
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '9999px',
                        padding: '1px 5px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        lineHeight: '1',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: '320px',
                      backgroundColor: 'var(--color-bg-surface, #ffffff)',
                      border: '1px solid var(--color-border, #e5e7eb)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--color-border, #e5e7eb)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                      <Link
                        to="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}
                      >
                        View All
                      </Link>
                    </div>

                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {recentNotifications.length === 0 ? (
                        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                          No notifications yet
                        </div>
                      ) : (
                        recentNotifications.map((notif) => (
                          <Link
                            key={notif._id}
                            to={notif.actionUrl || '/notifications'}
                            onClick={async () => {
                              setDropdownOpen(false);
                              if (!notif.isRead) {
                                try {
                                  await notificationApi.markAsRead(notif._id);
                                  setUnreadCount((c) => Math.max(0, c - 1));
                                } catch {
                                  // Non-critical background state update
                                }
                              }
                            }}
                            style={{
                              display: 'block',
                              padding: '10px 14px',
                              borderBottom: '1px solid var(--color-border-light, #f3f4f6)',
                              textDecoration: 'none',
                              backgroundColor: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: notif.isRead ? 400 : 600, fontSize: '13px', color: 'inherit' }}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    backgroundColor: '#2563eb',
                                    marginTop: '4px',
                                  }}
                                />
                              )}
                            </div>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280', lineHeight: 1.3 }}>
                              {notif.message.length > 70 ? `${notif.message.slice(0, 70)}...` : notif.message}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>

                    <div
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--color-bg-subtle, #f9fafb)',
                        textAlign: 'center',
                        borderTop: '1px solid var(--color-border, #e5e7eb)',
                      }}
                    >
                      <Link
                        to="/notifications/preferences"
                        onClick={() => setDropdownOpen(false)}
                        style={{ fontSize: '12px', color: '#4b5563', textDecoration: 'none' }}
                      >
                        ⚙ Preferences
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="btn btn-ghost btn-sm"
              aria-label={`Wishlist (${wishlistCount} items)`}
              title={`Wishlist (${wishlistCount})`}
            >
              ♡ {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>

            {/* Cart with live item counter */}
            <Link
              to="/cart"
              className="btn btn-ghost btn-sm"
              aria-label={`Shopping Cart (${cartCount} items)`}
              title={`Shopping Cart (${cartCount})`}
            >
              🛒 ({cartCount})
            </Link>

            {/* User Account State */}
            {isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Link
                  to="/profile"
                  className="btn btn-outline btn-sm"
                  title={`Signed in as ${user.name}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                >
                  <span style={{ fontWeight: 600 }}>👤 {user.name.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Mobile Navigation">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link to="/notifications" className="mobile-nav-link">
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </Link>
                  <Link to="/profile" className="mobile-nav-link">
                    My Profile ({user?.name})
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mobile-nav-link"
                    style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-2)' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-link">
                    Sign In
                  </Link>
                  <Link to="/register" className="mobile-nav-link">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

