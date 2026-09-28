import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../services/aiApi';
import { formatCurrency } from '../../utils/currency';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: string[];
  toolResults?: Array<{ tool: string; data: any }>;
  fallback?: boolean;
}

export const ShoppingAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Shopping Assistant. How can I help you discover products, compare specs, or check your cart today?',
      suggestedActions: [
        'What is in my cart?',
        'What do you recommend for me?',
        'Compare sneakers and boots',
        'Running shoes under ₹3000',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiApi.assistantChat(message, history);

      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          suggestedActions: res.data.suggestedActions,
          toolResults: res.data.toolResults,
          fallback: res.data.fallback,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Could not process request');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I'm temporarily having trouble connecting to our recommendation services. You can still search products directly in the search bar above.",
          suggestedActions: ['Browse catalog', 'Check my cart'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside
      className="shopping-assistant-container"
      aria-label="AI Shopping Assistant"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        fontFamily: 'inherit',
      }}
    >
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Shopping Assistant"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-primary, #2563eb)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'transform 0.2s, background-color 0.2s',
          }}
        >
          <span style={{ fontSize: '18px' }}>✨</span>
          <span>AI Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Shopping Assistant Chat"
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>✨</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>Nexus AI Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Real-time Catalog & Cart Guide</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Message Stream */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#f8fafc',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                }}
              >
                <div
                  style={{
                    backgroundColor: m.role === 'user' ? 'var(--color-primary, #2563eb)' : '#ffffff',
                    color: m.role === 'user' ? '#ffffff' : '#1e293b',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  }}
                >
                  {m.content}
                </div>

                {/* Render Tool Results (Products, Cart, Specs) */}
                {m.toolResults && m.toolResults.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {m.toolResults.map((tr, idx) => {
                      if ((tr.tool === 'searchProducts' || tr.tool === 'getRecommendations') && Array.isArray(tr.data)) {
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {tr.data.slice(0, 3).map((prod: any) => (
                              <Link
                                key={prod._id || prod.id}
                                to={`/products/${prod.slug || prod._id || prod.id}`}
                                onClick={() => setIsOpen(false)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  backgroundColor: '#ffffff',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  textDecoration: 'none',
                                  color: 'inherit',
                                }}
                              >
                                {prod.images?.[0] && (
                                  <img
                                    src={typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0].url}
                                    alt={prod.name}
                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                  />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {prod.name}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                                    {formatCurrency(prod.price)}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        );
                      }

                      if (tr.tool === 'getUserCartSummary' && tr.data) {
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                              Cart Total: {formatCurrency(tr.data.subtotal || 0)} ({tr.data.itemsCount || 0} items)
                            </div>
                            <Link
                              to="/cart"
                              onClick={() => setIsOpen(false)}
                              style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                color: '#2563eb',
                                fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              Go to Checkout & Cart →
                            </Link>
                          </div>
                        );
                      }

                      if (tr.tool === 'compareProducts' && tr.data?.products) {
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '11px',
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '6px' }}>Catalog Comparison:</div>
                            {tr.data.products.map((p: any) => (
                              <div key={p.id} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '4px', marginBottom: '4px' }}>
                                <strong>{p.name}</strong>: {formatCurrency(p.price)} | Rating: {p.rating || 'N/A'}★
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}

                {/* Suggested Action Chips */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '6px',
                    }}
                  >
                    {m.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleSendMessage(action)}
                        style={{
                          backgroundColor: '#e2e8f0',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                }}
              >
                Analyzing catalog & specs...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about shoes, specs, or your cart..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
              style={{
                backgroundColor: 'var(--color-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !inputMessage.trim() || isLoading ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
