import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../services/aiApi';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../context/CartContext';

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
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addToCart } = useCart();

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
  }, [messages, isOpen, isLoading]);

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

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'Conversation reset! How can I help you discover products or answer questions today?',
        suggestedActions: [
          'What is in my cart?',
          'What do you recommend for me?',
          'Running shoes under ₹3000',
        ],
      },
    ]);
  };

  const handleAddToCart = async (prod: any) => {
    const productId = prod._id || prod.id;
    if (!productId) return;
    setAddingId(productId);
    try {
      const variantSku = prod.variants?.[0]?.sku || prod.SKU || 'DEFAULT';
      await addToCart(productId, variantSku, 1);
      setAddedId(productId);
      setTimeout(() => setAddedId(null), 2500);
    } catch {
      // Non-blocking, handled in context
    } finally {
      setAddingId(null);
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
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            padding: '12px 20px',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-lg)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
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
            width: '390px',
            maxWidth: 'calc(100vw - 32px)',
            height: '540px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
            transition: 'background-color var(--transition-normal), border-color var(--transition-normal)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-contrast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>Nexus AI Assistant</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Catalog Recommendations & Cart Copilot</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Reset conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Reset ↺
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close assistant"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>
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
              backgroundColor: 'var(--color-bg)',
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
                    backgroundColor: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: m.role === 'user' ? 'var(--color-primary-contrast)' : 'var(--color-text)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
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
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {tr.data.slice(0, 3).map((prod: any) => {
                              const prodId = prod._id || prod.id;
                              const isAdding = addingId === prodId;
                              const isAdded = addedId === prodId;
                              const imageUrl = prod.images?.[0]
                                ? typeof prod.images[0] === 'string'
                                  ? prod.images[0]
                                  : prod.images[0].url
                                : null;

                              return (
                                <div
                                  key={prodId}
                                  style={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    padding: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    boxShadow: 'var(--shadow-sm)',
                                  }}
                                >
                                  <Link
                                    to={`/products/${prod.slug || prodId}`}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      textDecoration: 'none',
                                      color: 'inherit',
                                    }}
                                  >
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={prod.name}
                                        style={{
                                          width: '46px',
                                          height: '46px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          border: '1px solid var(--color-border)',
                                        }}
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: '46px',
                                          height: '46px',
                                          backgroundColor: 'var(--color-bg-secondary)',
                                          borderRadius: '6px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '18px',
                                        }}
                                      >
                                        🛍️
                                      </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          color: 'var(--color-text)',
                                        }}
                                      >
                                        {prod.name}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 700 }}>
                                          {formatCurrency(prod.price)}
                                        </span>
                                        {prod.rating && (
                                          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                                            ★ {prod.rating}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>

                                  {/* Direct Add to Cart Action */}
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(prod)}
                                    disabled={isAdding || isAdded}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      backgroundColor: isAdded ? 'var(--color-success)' : 'var(--color-primary-light)',
                                      color: isAdded ? '#ffffff' : 'var(--color-primary)',
                                      border: '1px solid ' + (isAdded ? 'var(--color-success)' : 'var(--color-primary)'),
                                      borderRadius: '6px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: isAdding || isAdded ? 'default' : 'pointer',
                                      transition: 'all var(--transition-fast)',
                                    }}
                                  >
                                    {isAdded ? 'Added to Cart ✓' : isAdding ? 'Adding...' : 'Add to Cart 🛒'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      if (tr.tool === 'getUserCartSummary' && tr.data) {
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid var(--color-border)',
                              fontSize: '13px',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                              🛒 Cart Total: {formatCurrency(tr.data.subtotal || 0)} ({tr.data.itemsCount || 0} items)
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                              <Link
                                to="/cart"
                                onClick={() => setIsOpen(false)}
                                style={{
                                  flex: 1,
                                  textAlign: 'center',
                                  padding: '6px 10px',
                                  backgroundColor: 'var(--color-surface-hover)',
                                  borderRadius: '6px',
                                  color: 'var(--color-text)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  textDecoration: 'none',
                                  border: '1px solid var(--color-border)',
                                }}
                              >
                                View Cart
                              </Link>
                              <Link
                                to="/checkout"
                                onClick={() => setIsOpen(false)}
                                style={{
                                  flex: 1,
                                  textAlign: 'center',
                                  padding: '6px 10px',
                                  backgroundColor: 'var(--color-primary)',
                                  color: 'var(--color-primary-contrast)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                Checkout →
                              </Link>
                            </div>
                          </div>
                        );
                      }

                      if (tr.tool === 'compareProducts' && tr.data?.products) {
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              padding: '10px',
                              borderRadius: '10px',
                              border: '1px solid var(--color-border)',
                              fontSize: '12px',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>Catalog Comparison:</div>
                            {tr.data.products.map((p: any) => (
                              <div
                                key={p.id || p._id}
                                style={{
                                  borderBottom: '1px dashed var(--color-border)',
                                  paddingBottom: '6px',
                                  marginBottom: '6px',
                                  color: 'var(--color-text)',
                                }}
                              >
                                <strong>{p.name}</strong>: {formatCurrency(p.price)} | Rating: {p.rating ? `${p.rating}★` : 'N/A'}
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
                      gap: '6px',
                      marginTop: '8px',
                    }}
                  >
                    {m.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        onClick={() => handleSendMessage(action)}
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '14px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Typing Animation State */}
            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'var(--color-surface)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ fontSize: '14px' }}>✨</span>
                <span>Nexus AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products, specs, or your cart..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
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
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                opacity: !inputMessage.trim() || isLoading ? 0.6 : 1,
                transition: 'opacity var(--transition-fast)',
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
