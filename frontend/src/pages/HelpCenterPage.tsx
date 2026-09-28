import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { faqApi, FAQItem } from '../services/faqApi';

export const HelpCenterPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    'All',
    'Ordering',
    'Payments',
    'Shipping & Delivery',
    'Returns & Refunds',
    'Account & Security',
    'Product Inquiry',
    'General',
  ];

  useEffect(() => {
    const fetchFAQs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await faqApi.getPublishedFAQs({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
        });
        setFaqs(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load Help Center FAQs');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [selectedCategory, searchQuery]);

  return (
    <>
      <SEO
        title="Help Center & FAQs"
        description="Find answers to frequently asked questions regarding orders, shipping, payments, returns, and account security."
        canonicalUrl={`${window.location.origin}/help`}
        ogTitle="Help Center & FAQs | Nexus Commerce"
        ogDescription="Find answers to frequently asked questions regarding orders, shipping, payments, returns, and account security."
        ogUrl={`${window.location.origin}/help`}
      />

      <div className="container" style={{ maxWidth: '850px', margin: '40px auto', padding: '0 16px' }}>
      {/* Hero Banner */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 10px', color: '#111827' }}>
          Help Center & FAQs
        </h1>
        <p style={{ margin: '0 0 24px', color: '#4b5563', fontSize: '16px' }}>
          Find fast answers to common questions regarding orders, payments, shipping, and returns.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, e.g. 'refund', 'tracking'..."
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor: selectedCategory === cat ? '#2563eb' : '#ffffff',
              color: selectedCategory === cat ? '#ffffff' : '#374151',
              borderColor: selectedCategory === cat ? '#2563eb' : '#d1d5db',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQs List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          Loading answers...
        </div>
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      ) : faqs.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px' }}>No articles match your search</h3>
          <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
            Can't find what you are looking for? Our support team is available 24/7.
          </p>
          <Link to="/support/new" className="btn btn-primary btn-sm">
            Contact Support
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq) => {
            const isExpanded = expandedId === faq._id;
            return (
              <div
                key={faq._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : faq._id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '4px' }}>
                      {faq.category}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>
                      {faq.question}
                    </span>
                  </div>
                  <span style={{ fontSize: '18px', color: '#9ca3af', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', color: '#4b5563', fontSize: '14px', lineHeight: 1.6, borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ margin: '14px 0 16px' }}>{faq.answer}</p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/help/${faq.slug}`}
                        style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}
                      >
                        Permanent Link & Structured View →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Still need help CTA */}
      <div style={{ marginTop: '48px', padding: '28px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
          Still need assistance?
        </h3>
        <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px' }}>
          Our customer care specialists are ready to help with orders, tracking, or refunds.
        </p>
        <Link to="/support/new" className="btn btn-primary">
          Open Support Ticket
        </Link>
      </div>
    </div>
  </>
  );
};
