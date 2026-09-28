import React, { useState } from 'react';
import { notificationApi } from '../services/notificationApi';

export const AdminNotificationsPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('PROMOTION');
  const [priority, setPriority] = useState('MEDIUM');
  const [actionUrl, setActionUrl] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (!window.confirm('Broadcast this notification to all matching active users?')) return;

    setBroadcasting(true);
    setResultMessage(null);
    setError(null);

    try {
      const res = await notificationApi.broadcastNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        actionUrl: actionUrl.trim() || undefined,
        targetRole: targetRole || undefined,
      });

      setResultMessage(`✓ Notification broadcast dispatched successfully to ${res.sentCount} users!`);
      setTitle('');
      setMessage('');
      setActionUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          Broadcast Marketing & System Notifications
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Send real announcements, flash sale alerts, or maintenance notifications to all active users.
        </p>
      </div>

      {resultMessage && (
        <div style={{ padding: '14px 18px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {resultMessage}
        </div>
      )}

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleBroadcast} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Notification Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="PROMOTION">Promotional Announcement</option>
              <option value="FLASH_SALE">Flash Sale Alert</option>
              <option value="COUPON">Coupon / Discount Code</option>
              <option value="SYSTEM">System Announcement</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Target Role (Optional)
          </label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
          >
            <option value="">All Users</option>
            <option value="USER">Customers Only (USER)</option>
            <option value="ADMIN">Admins Only</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Notification Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 50% Off Flash Sale This Weekend!"
            required
            maxLength={150}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Action URL (Optional)
          </label>
          <input
            type="text"
            value={actionUrl}
            onChange={(e) => setActionUrl(e.target.value)}
            placeholder="e.g. /products or /catalog"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Notification Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Detailed broadcast announcement text..."
            rows={4}
            required
            maxLength={1000}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={broadcasting} className="btn btn-primary">
            {broadcasting ? 'Broadcasting...' : '📢 Send Broadcast'}
          </button>
        </div>
      </form>
    </div>
  );
};
