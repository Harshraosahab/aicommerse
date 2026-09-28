import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { supportApi } from '../services/supportApi';

export const NewSupportTicketPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ORDER');
  const [message, setMessage] = useState('');
  const [relatedOrder, setRelatedOrder] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ticket = await supportApi.createTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
        relatedOrder: relatedOrder.trim() || undefined,
        priority,
      });

      navigate(`/support/tickets/${ticket.ticketNumber}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket');
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Submit Support Ticket" description="Create a new customer support ticket." noIndex={true} />
      <div className="container" style={{ maxWidth: '680px', margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/support" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
          ← Back to Support
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0 4px' }}>Submit a Support Request</h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Fill out this form and our support representatives will respond promptly.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
          >
            <option value="ORDER">Order Issue or Inquiry</option>
            <option value="PAYMENT">Payment & Billing</option>
            <option value="DELIVERY">Shipping & Delivery Tracking</option>
            <option value="RETURN">Return & Exchange</option>
            <option value="REFUND">Refund Inquiry</option>
            <option value="PRODUCT">Product Details or Quality</option>
            <option value="ACCOUNT">Account & Authentication</option>
            <option value="TECHNICAL">Technical Issue / Bug</option>
            <option value="OTHER">General Inquiry</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
            required
            minLength={5}
            maxLength={200}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Related Order Number (Optional)
          </label>
          <input
            type="text"
            value={relatedOrder}
            onChange={(e) => setRelatedOrder(e.target.value)}
            placeholder="e.g. ORD-20260916-A1B2C3"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
            If your request relates to a specific purchase, provide the order number for faster assistance.
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Urgency / Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
          >
            <option value="LOW">Low - General inquiry</option>
            <option value="MEDIUM">Medium - Normal assistance</option>
            <option value="HIGH">High - Needs prompt attention</option>
            <option value="URGENT">Urgent - Order problem or delivery issue</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Detailed Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue with as much detail as possible..."
            rows={6}
            required
            minLength={10}
            maxLength={3000}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Link to="/support" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};
