import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { notificationApi, NotificationPreferences } from '../services/notificationApi';

export const NotificationPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      orderUpdates: true,
      paymentUpdates: true,
      shippingUpdates: true,
      supportUpdates: true,
      promotional: true,
      priceDrop: true,
      backInStock: true,
    },
    inApp: {
      orderUpdates: true,
      paymentUpdates: true,
      shippingUpdates: true,
      supportUpdates: true,
      promotional: true,
      priceDrop: true,
      backInStock: true,
    },
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await notificationApi.getPreferences();
        if (data) {
          setPreferences({
            email: { ...preferences.email, ...data.email },
            inApp: { ...preferences.inApp, ...data.inApp },
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, []);

  const handleToggle = (channel: 'email' | 'inApp', key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: !((prev[channel] as any)[key] ?? true),
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setError(null);
    try {
      await notificationApi.updatePreferences(preferences);
      setSuccessMessage('Notification preferences updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const preferenceItems = [
    { key: 'orderUpdates', label: 'Order Confirmation & Status Updates', desc: 'Updates when your order is placed, processed or packed' },
    { key: 'paymentUpdates', label: 'Payment Receipts & Alerts', desc: 'Confirmations for transactions and invoice updates' },
    { key: 'shippingUpdates', label: 'Shipping & Delivery Tracking', desc: 'Notifications when packages are dispatched or out for delivery' },
    { key: 'supportUpdates', label: 'Support Ticket Replies', desc: 'Answers from customer support representatives on your open inquiries' },
    { key: 'priceDrop', label: 'Wishlist Price Drops', desc: 'Alerts when items in your saved wishlist receive discounts' },
    { key: 'backInStock', label: 'Back in Stock Alerts', desc: 'Reminders when out-of-stock items in your wishlist are replenished' },
    { key: 'promotional', label: 'Promotions, Coupons & Flash Sales', desc: 'Curated marketing specials, discount coupons, and seasonal sales' },
  ];

  if (loading) {
    return <div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading preferences...</div>;
  }

  return (
    <>
      <SEO title="Notification Preferences" description="Configure notification alerts and communication channels." noIndex={true} />
      <div className="container" style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/notifications" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Notifications
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px' }}>Notification Preferences</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Control which communication channels you prefer for each category of updates.
        </p>
      </div>

      {successMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '14px 20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>
            <span>Category</span>
            <span style={{ textAlign: 'center' }}>Email</span>
            <span style={{ textAlign: 'center' }}>In-App</span>
          </div>

          {/* Rows */}
          {preferenceItems.map((item) => {
            const emailChecked = (preferences.email as any)[item.key] !== false;
            const inAppChecked = (preferences.inApp as any)[item.key] !== false;

            return (
              <div
                key={item.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.desc}</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={emailChecked}
                    onChange={() => handleToggle('email', item.key)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    aria-label={`Email updates for ${item.label}`}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={inAppChecked}
                    onChange={() => handleToggle('inApp', item.key)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    aria-label={`In-App updates for ${item.label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link to="/notifications" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};
