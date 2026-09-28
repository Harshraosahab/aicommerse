import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';
import { faqApi, FAQItem } from '../services/faqApi';
import { generateFAQSchema } from '../utils/structuredData';

export const FAQDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [faq, setFaq] = useState<FAQItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchFaq = async () => {
      setLoading(true);
      setError(null);
      try {
        const item = await faqApi.getFAQBySlug(slug);
        setFaq(item);
      } catch (err: any) {
        setError(err.message || 'FAQ article not found');
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, [slug]);

  if (loading) {
    return <div className="container" style={{ padding: '60px', textAlign: 'center' }}>Loading article...</div>;
  }

  if (error || !faq) {
    return (
      <div className="container" style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
        <div style={{ padding: '24px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error || 'Article not found'}
        </div>
        <Link to="/help" className="btn btn-outline" style={{ marginTop: '16px', display: 'inline-block' }}>
          ← Back to Help Center
        </Link>
      </div>
    );
  }

  const canonicalUrl = `${window.location.origin}/help/${faq.slug}`;
  const faqSchema = generateFAQSchema([{ question: faq.question, answer: faq.answer }]);

  return (
    <>
      <SEO
        title={`${faq.question} - Help Center`}
        description={faq.answer.slice(0, 160)}
        canonicalUrl={canonicalUrl}
        ogTitle={`${faq.question} | Help Center`}
        ogDescription={faq.answer.slice(0, 160)}
        ogUrl={canonicalUrl}
        schema={faqSchema}
      />

      <div className="container" style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Link to="/help" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none' }}>
            ← Back to Help Center
          </Link>
        </div>

        <article style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 10px', borderRadius: '16px', fontWeight: 600 }}>
            {faq.category}
          </span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 20px', color: '#111827', lineHeight: 1.3 }}>
          {faq.question}
        </h1>

        <div style={{ color: '#374151', fontSize: '16px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {faq.answer}
        </div>

        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#9ca3af' }}>
          <span>Published on Nexus Help Center</span>
          <Link to="/support/new" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Question not answered? Contact Support →
          </Link>
        </div>
      </article>
    </div>
  </>
  );
};
