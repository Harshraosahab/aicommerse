import React, { useState, useEffect } from 'react';
import { SEO } from '../components/common/SEO';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { adminApi } from '../services/adminApi';
import { Search, RefreshCw, Send } from 'lucide-react';

export const AdminSupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replyStatus, setReplyStatus] = useState<string>('IN_PROGRESS');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchQuery || undefined,
      });
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  const openTicketDetail = async (ticket: any) => {
    try {
      const res = await adminApi.getTicketById(ticket._id || ticket.id);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
        setReplyStatus(res.data.status || 'IN_PROGRESS');
      } else {
        setSelectedTicket(ticket);
        setReplyStatus(ticket.status || 'IN_PROGRESS');
      }
    } catch {
      setSelectedTicket(ticket);
      setReplyStatus(ticket.status || 'IN_PROGRESS');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setIsSubmittingReply(true);
      const ticketId = selectedTicket._id || selectedTicket.id;
      const res = await adminApi.respondToTicket(ticketId, replyMessage.trim(), replyStatus);
      if (res.success && res.data) {
        setSelectedTicket(res.data);
      }
      setReplyMessage('');
      await loadTickets();
    } catch (err: any) {
      alert(err.message || 'Failed to send response');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fee2e2', color: '#b91c1c' }}>Urgent</span>;
      case 'HIGH':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ffedd5', color: '#c2410c' }}>High</span>;
      case 'MEDIUM':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309' }}>Medium</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>Open</span>;
      case 'IN_PROGRESS':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef9c3', color: '#854d0e' }}>In Progress</span>;
      case 'RESOLVED':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>Resolved</span>;
      case 'CLOSED':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#64748b' }}>Closed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <>
      <SEO title="Support Tickets | Admin" description="Customer support requests and issue resolution." />

      <div style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Customer Support & Inquiries</h1>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 'var(--space-1)' }}>
            Real customer service tickets, response management, and resolution tracking.
          </p>
        </div>
        <Button variant="secondary" onClick={loadTickets} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
          Refresh
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <CardBody style={{ padding: 'var(--space-4)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder="Search ticket subject, user email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3) var(--space-2) 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#fff',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <Button type="submit" variant="primary" size="sm">Search</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#64748b' }}>
              Loading support tickets from database...
            </div>
          ) : error ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: '#b91c1c' }}>
              {error}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              title="No support tickets found"
              description="Zero customer support inquiries matching the specified criteria."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Ticket # / Date</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Priority</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const ticketId = t._id || t.id;
                    const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—';
                    const userEmail = t.user?.email || t.userId?.email || t.customerEmail || 'Customer';
                    const userName = t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() : '';

                    return (
                      <tr key={ticketId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{ticketId.slice(-6).toUpperCase()}</span>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{dateStr}</div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          <div style={{ fontWeight: 500 }}>{userName || userEmail}</div>
                          {userName && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{userEmail}</div>}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.subject}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.message || (t.messages && t.messages[0]?.message) || 'No message preview'}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {getPriorityBadge(t.priority)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                          {getStatusBadge(t.status)}
                        </td>
                        <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                          <Button size="sm" variant="secondary" onClick={() => openTicketDetail(t)}>
                            View & Reply
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Ticket #{selectedTicket._id?.slice(-6).toUpperCase()}</h3>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{selectedTicket.subject}</div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)', overflowY: 'auto', flex: 1 }}>
              {/* Ticket Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', backgroundColor: '#f8fafc', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Customer</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedTicket.user?.email || selectedTicket.customerEmail || 'Customer'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Priority</div>
                  <div style={{ marginTop: '2px' }}>{getPriorityBadge(selectedTicket.priority)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Status</div>
                  <div style={{ marginTop: '2px' }}>{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Ref</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedTicket.orderId ? `#${selectedTicket.orderId.toString().slice(-6)}` : 'N/A'}</div>
                </div>
              </div>

              {/* Thread Messages */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-sm)', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>Message History</h4>

                {/* Original Message */}
                <div style={{ backgroundColor: '#f1f5f9', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.75rem', color: '#475569' }}>
                    <span style={{ fontWeight: 600 }}>Customer Message</span>
                    <span>{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : ''}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                    {selectedTicket.message || (selectedTicket.messages && selectedTicket.messages[0]?.message) || 'No message body.'}
                  </div>
                </div>

                {/* Follow-up messages */}
                {selectedTicket.messages && selectedTicket.messages.slice(1).map((m: any, idx: number) => {
                  const isAdmin = m.senderRole === 'ADMIN' || m.senderRole === 'SUPPORT' || m.isAdmin;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: isAdmin ? '#eff6ff' : '#f8fafc',
                        border: isAdmin ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-3)',
                        marginLeft: isAdmin ? 'var(--space-6)' : 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.75rem', color: isAdmin ? '#1d4ed8' : '#475569' }}>
                        <span style={{ fontWeight: 600 }}>{isAdmin ? 'Staff Response' : 'Customer'}</span>
                        <span>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply}>
                <h4 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-size-sm)', fontWeight: 600, textTransform: 'uppercase', color: '#64748b' }}>Post Staff Reply</h4>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <textarea
                    rows={4}
                    placeholder="Type your response to the customer here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Update Status To:</label>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      style={{
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                      <option value="OPEN">Open</option>
                    </select>
                  </div>

                  <Button type="submit" variant="primary" disabled={isSubmittingReply || !replyMessage.trim()} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Send size={16} />
                    {isSubmittingReply ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
