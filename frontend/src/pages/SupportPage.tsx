import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { supportApi, SupportTicket } from '../services/supportApi';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await supportApi.getMyTickets({
          status: statusFilter || undefined,
          limit: 10,
        });
        setTickets(data.tickets);
      } catch (err: any) {
        setError(err.message || 'Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="badge badge-warning">Open</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary">In Progress</span>;
      case 'WAITING_FOR_CUSTOMER':
        return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Awaiting Your Reply</span>;
      case 'RESOLVED':
        return <span className="badge badge-success">Resolved</span>;
      case 'CLOSED':
        return <span className="badge badge-neutral">Closed</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  return (
    <>
      <SEO title="Customer Support" description="Submit and track your customer support tickets." noIndex={true} />
      <div className="container" style={{ maxWidth: '900px', margin: '40px auto', padding: '0 16px' }}>
      {/* Banner */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: '#1e3a8a' }}>Customer Support Center</h1>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
            Have questions about an order or product? Our support team is here to assist you.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/help" className="btn btn-outline" style={{ backgroundColor: '#ffffff' }}>
            🔍 Browse FAQs
          </Link>
          <Link to="/support/new" className="btn btn-primary">
            + New Support Ticket
          </Link>
        </div>
      </div>

      {/* Tickets List Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>My Support Inquiries</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting for You</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading your support tickets...</div>
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>No Support Tickets</h3>
          <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
            You have not submitted any customer support requests.
          </p>
          <Link to="/support/new" className="btn btn-primary btn-sm">
            Create a Ticket
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => navigate(`/support/tickets/${t.ticketNumber}`)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#2563eb' }}>{`#${t.ticketNumber}`}</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', color: '#4b5563' }}>
                    {t.category}
                  </span>
                  {getStatusBadge(t.status)}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0', color: '#111827' }}>{t.subject}</h3>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Updated {new Date(t.updatedAt).toLocaleDateString()} • {t.responses?.length || 0} replies
                  {t.relatedOrder && ` • Order #${t.relatedOrder.orderNumber}`}
                </div>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '18px' }}>→</div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};
