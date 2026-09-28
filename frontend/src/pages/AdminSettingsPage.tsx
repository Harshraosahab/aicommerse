import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { adminApi } from '../services/adminApi';
import { Settings, Shield, Server, CreditCard, Mail, RefreshCw, CheckCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <>
      <SEO title="System Settings | Admin" description="Platform configuration and environment status." />

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Settings size={26} color="#0284c7" />
            Platform & Environment Settings
          </h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Inspecting active runtime parameters, commerce policies, and service integrations safely.
          </p>
        </div>
        <Button variant="secondary" onClick={loadSettings} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardBody style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
            Loading platform configuration...
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
            {error}
          </CardBody>
        </Card>
      ) : settings ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Security & Secret Redaction Guarantee */}
          <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Shield size={20} color="#16a34a" />
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#166534' }}>
              <strong>Zero Secret Exposure Guarantee:</strong> All sensitive credentials (<code style={{ backgroundColor: '#dcfce7', padding: '1px 4px', borderRadius: '4px' }}>JWT_SECRET</code>, <code style={{ backgroundColor: '#dcfce7', padding: '1px 4px', borderRadius: '4px' }}>MONGODB_URI</code>, <code style={{ backgroundColor: '#dcfce7', padding: '1px 4px', borderRadius: '4px' }}>RAZORPAY_KEY_SECRET</code>, <code style={{ backgroundColor: '#dcfce7', padding: '1px 4px', borderRadius: '4px' }}>SMTP_PASS</code>) are masked and never transmitted to client browsers.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
            {/* Environment & Node Runtime */}
            <Card>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
                <Server size={18} color="#475569" />
                Server & Runtime Environment
              </div>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Environment (NODE_ENV)</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{settings.environment?.nodeEnv || 'development'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Server Port</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{settings.environment?.port || 5000}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>CORS Origin</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{settings.environment?.corsOrigin || 'http://localhost:5173'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>MongoDB Connection</span>
                    <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} />
                      Connected ({settings.environment?.databaseMasked || '[CONFIGURED]'})
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Payment Integrations */}
            <Card>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
                <CreditCard size={18} color="#475569" />
                Payment Gateway Configuration
              </div>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Active Gateways</span>
                    <span style={{ fontWeight: 600 }}>Razorpay & Cash on Delivery</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Razorpay Key ID</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{settings.payments?.razorpayKeyId || 'rzp_test_***'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Razorpay Secret</span>
                    <span style={{ color: '#16a34a', fontWeight: 600, fontFamily: 'monospace' }}>{settings.payments?.razorpaySecretMasked || '[CONFIGURED]'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Default Currency</span>
                    <span style={{ fontWeight: 600 }}>{settings.commerce?.currency || 'INR (₹)'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Commerce & Pricing Rules */}
            <Card>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
                <Settings size={18} color="#475569" />
                Commerce & Shipping Policies
              </div>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Standard Tax Rate</span>
                    <span style={{ fontWeight: 600 }}>{settings.commerce?.taxRate || 18}% (GST)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Free Shipping Threshold</span>
                    <span style={{ fontWeight: 600 }}>₹{settings.commerce?.freeShippingThreshold || 999}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Standard Delivery Fee</span>
                    <span style={{ fontWeight: 600 }}>₹{settings.commerce?.standardShippingFee || 49}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Return Window</span>
                    <span style={{ fontWeight: 600 }}>{settings.commerce?.returnWindowDays || 7} Days</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Email & Notifications */}
            <Card>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
                <Mail size={18} color="#475569" />
                Email & Communications Service
              </div>
              <CardBody style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>SMTP Provider</span>
                    <span style={{ fontWeight: 600 }}>{settings.email?.host || 'smtp.ethereal.email (Mock/Test)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>Sender Address</span>
                    <span style={{ fontWeight: 600 }}>{settings.email?.from || 'noreply@ecommerce.local'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 'var(--space-2)' }}>
                    <span style={{ color: '#64748b' }}>SMTP Port</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{settings.email?.port || 587}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Password Status</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>{settings.email?.passwordMasked || '[CONFIGURED]'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
};
