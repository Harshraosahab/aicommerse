import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { notificationApi, NotificationItem } from '../services/notificationApi';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ORDER' | 'PROMO'>('ALL');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const isReadParam = filter === 'UNREAD' ? false : undefined;
      const data = await notificationApi.getNotifications({
        page,
        limit: 15,
        isRead: isReadParam,
      });

      // Filter locally for ORDER and PROMO if requested
      let filtered = data.notifications;
      if (filter === 'ORDER') {
        filtered = filtered.filter(
          (n) => n.type.startsWith('ORDER_') || n.type.startsWith('PAYMENT_') || n.type.startsWith('RETURN_')
        );
      } else if (filter === 'PROMO') {
        filtered = filtered.filter(
          (n) => n.type === 'PROMOTION' || n.type === 'COUPON' || n.type === 'FLASH_SALE' || n.type === 'PRICE_DROP'
        );
      }

      setNotifications(filtered);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      alert(err.message || 'Could not mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err: any) {
      alert(err.message || 'Could not mark all as read');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err: any) {
      alert(err.message || 'Could not delete notification');
    }
  };

  const handleClearRead = async () => {
    if (!window.confirm('Clear all read notifications?')) return;
    try {
      await notificationApi.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err: any) {
      alert(err.message || 'Could not clear read notifications');
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'badge-danger';
      case 'MEDIUM':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.startsWith('ORDER_')) return '📦';
    if (type.startsWith('PAYMENT_')) return '💳';
    if (type.startsWith('RETURN_') || type.startsWith('REFUND_')) return '🔄';
    if (type.startsWith('SUPPORT_')) return '🎫';
    if (type === 'PRICE_DROP') return '🏷️';
    if (type === 'BACK_IN_STOCK') return '✨';
    if (type === 'PROMOTION' || type === 'FLASH_SALE') return '🔥';
    return '🔔';
  };

  return (
    <>
      <SEO title="Notification Center" description="View and manage your account notifications." noIndex={true} />
      <div className="container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Notification Center</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '14px' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/notifications/preferences" className="btn btn-outline btn-sm">
            ⚙ Preferences
          </Link>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-primary btn-sm">
              Mark all as read
            </button>
          )}
          <button onClick={handleClearRead} className="btn btn-ghost btn-sm" title="Remove read notifications">
            Clear Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px', paddingBottom: '8px' }}>
        {[
          { key: 'ALL', label: 'All' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'ORDER', label: 'Orders & Payments' },
          { key: 'PROMO', label: 'Offers & Alerts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key as any);
              setPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: filter === tab.key ? '#2563eb' : '#f3f4f6',
              color: filter === tab.key ? '#ffffff' : '#4b5563',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          Loading notifications...
        </div>
      ) : error ? (
        <div style={{ padding: '24px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>No notifications found</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            {filter === 'UNREAD' ? 'You have read all your notifications!' : 'There are no notifications matching this view.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => {
                if (!notif.isRead) handleMarkAsRead(notif._id);
                if (notif.actionUrl) navigate(notif.actionUrl);
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px',
                backgroundColor: notif.isRead ? '#ffffff' : '#f0f7ff',
                border: `1px solid ${notif.isRead ? '#e5e7eb' : '#bfdbfe'}`,
                borderRadius: '8px',
                cursor: notif.actionUrl ? 'pointer' : 'default',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ fontSize: '24px', flexShrink: 0, lineHeight: 1 }}>{getTypeIcon(notif.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: notif.isRead ? 600 : 700, fontSize: '15px', color: '#111827' }}>
                    {notif.title}
                  </span>
                  <span className={`badge ${getPriorityBadgeClass(notif.priority)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {notif.priority}
                  </span>
                  {!notif.isRead && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                  )}
                </div>
                <p style={{ margin: '0 0 8px', color: '#4b5563', fontSize: '14px', lineHeight: 1.4 }}>
                  {notif.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#9ca3af' }}>
                  <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif._id);
                        }}
                        style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: '12px', textDecoration: 'underline' }}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '14px' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </>
  );
};
