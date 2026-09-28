import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { supportApi, SupportTicket } from '../services/supportApi';

export const SupportTicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);

  const fetchTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supportApi.getTicketById(ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load support ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const updated = await supportApi.addReply(ticket.ticketNumber, replyMessage.trim());
      setTicket(updated);
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleClose = async () => {
    if (!ticket || !window.confirm('Are you sure you want to close this ticket?')) return;

    setClosing(true);
    try {
      const updated = await supportApi.closeTicket(ticket.ticketNumber);
      setTicket(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

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

  if (loading) {
    return <div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading ticket details...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="container" style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
        <div style={{ padding: '24px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error || 'Ticket not found'}
        </div>
        <Link to="/support" className="btn btn-outline" style={{ marginTop: '16px', display: 'inline-block' }}>
          ← Back to Support
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO title={`Support Ticket #${ticket.ticketNumber}`} description="View support ticket inquiry and conversation thread." noIndex={true} />
      <div className="container" style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/support" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Support Tickets
        </Link>
      </div>

      {/* Ticket Header Card */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#2563eb' }}>#{ticket.ticketNumber}</span>
              <span style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', color: '#4b5563' }}>
                {ticket.category}
              </span>
              {getStatusBadge(ticket.status)}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0', color: '#111827' }}>{ticket.subject}</h1>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Created {new Date(ticket.createdAt).toLocaleString()}
              {ticket.relatedOrder && (
                <span> • Related Order: <Link to={`/orders/${ticket.relatedOrder.orderNumber}`} style={{ color: '#2563eb' }}>#{ticket.relatedOrder.orderNumber}</Link></span>
              )}
            </div>
          </div>

          {ticket.status !== 'CLOSED' && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              {closing ? 'Closing...' : 'Close Ticket'}
            </button>
          )}
        </div>

        {/* Initial Customer Message */}
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#4b5563', marginBottom: '6px' }}>Your Original Message:</div>
          <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {ticket.message}
          </p>
        </div>
      </div>

      {/* Conversation Thread */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
        Conversation History ({ticket.responses?.length || 0})
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {ticket.responses && ticket.responses.length > 0 ? (
          ticket.responses.map((resp, idx) => {
            const isAgent = resp.senderRole === 'ADMIN' || resp.senderRole === 'SUPPORT_MANAGER';
            return (
              <div
                key={resp._id || idx}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: isAgent ? '#eff6ff' : '#ffffff',
                  border: `1px solid ${isAgent ? '#bfdbfe' : '#e5e7eb'}`,
                  marginLeft: isAgent ? '24px' : 0,
                  marginRight: isAgent ? 0 : '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                  <span style={{ fontWeight: 700, color: isAgent ? '#1e40af' : '#111827' }}>
                    {isAgent ? '🛡️ Customer Support Representative' : '👤 You'}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {new Date(resp.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {resp.message}
                </p>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280', fontSize: '14px' }}>
            Awaiting response from our support team. We usually reply within a few hours.
          </div>
        )}
      </div>

      {/* Reply Input Box */}
      {ticket.status !== 'CLOSED' ? (
        <form onSubmit={handleSendReply} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Add a Reply
          </label>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply or provide additional details..."
            rows={4}
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={submittingReply || !replyMessage.trim()} className="btn btn-primary">
              {submittingReply ? 'Sending...' : 'Post Reply'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          This ticket has been closed. If you need further assistance, please submit a new support request.
        </div>
      )}
    </div>
    </>
  );
};
