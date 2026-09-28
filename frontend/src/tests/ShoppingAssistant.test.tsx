import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShoppingAssistantWidget } from '../components/assistant/ShoppingAssistantWidget';
import { aiApi } from '../services/aiApi';

vi.mock('../services/aiApi', () => ({
  aiApi: {
    assistantChat: vi.fn(),
  },
}));

const mockAddToCart = vi.fn().mockResolvedValue(undefined);
vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    cartCount: 0,
    wishlistCount: 0,
  }),
}));

describe('ShoppingAssistantWidget Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders floating trigger button and toggles open/close', () => {
    render(
      <MemoryRouter>
        <ShoppingAssistantWidget />
      </MemoryRouter>
    );

    const openBtn = screen.getByRole('button', { name: /open ai shopping assistant/i });
    expect(openBtn).toBeInTheDocument();

    fireEvent.click(openBtn);

    expect(screen.getByRole('dialog', { name: /shopping assistant chat/i })).toBeInTheDocument();
    expect(screen.getByText(/Nexus AI Assistant/i)).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close assistant/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sends user message and displays assistant response with interactive product cards', async () => {
    vi.mocked(aiApi.assistantChat).mockResolvedValueOnce({
      success: true,
      data: {
        reply: "I've searched our catalog for running shoes:",
        suggestedActions: ['Filter by brand', 'View trending'],
        toolResults: [
          {
            tool: 'searchProducts',
            data: [
              {
                _id: 'p1',
                name: 'Pro Speed Runner',
                slug: 'pro-speed-runner',
                price: 2499,
                SKU: 'PRO-RUN-01',
                images: ['https://example.com/shoe.jpg'],
              },
            ],
          },
        ],
        fallback: false,
      },
    });

    render(
      <MemoryRouter>
        <ShoppingAssistantWidget />
      </MemoryRouter>
    );

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /open ai shopping assistant/i }));

    // Type query
    const input = screen.getByPlaceholderText(/ask about products/i);
    fireEvent.change(input, { target: { value: 'running shoes under 3000' } });

    const sendBtn = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendBtn);

    expect(screen.getByText('running shoes under 3000')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("I've searched our catalog for running shoes:")).toBeInTheDocument();
      expect(screen.getByText('Pro Speed Runner')).toBeInTheDocument();
      expect(screen.getByText('Filter by brand')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    // Test direct Add to Cart click
    const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartBtn);

    expect(mockAddToCart).toHaveBeenCalledWith('p1', 'PRO-RUN-01', 1);
  });

  it('renders cart summary tool preview when checking cart', async () => {
    vi.mocked(aiApi.assistantChat).mockResolvedValueOnce({
      success: true,
      data: {
        reply: 'Here are the active items currently in your cart:',
        suggestedActions: ['Proceed to checkout'],
        toolResults: [
          {
            tool: 'getUserCartSummary',
            data: {
              hasUser: true,
              itemsCount: 3,
              subtotal: 5497,
              currency: 'INR',
              items: [],
            },
          },
        ],
        fallback: false,
      },
    });

    render(
      <MemoryRouter>
        <ShoppingAssistantWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /open ai shopping assistant/i }));

    const input = screen.getByPlaceholderText(/ask about products/i);
    fireEvent.change(input, { target: { value: 'what is in my cart' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/Cart Total:/i)).toBeInTheDocument();
      expect(screen.getByText(/View Cart/i)).toBeInTheDocument();
      expect(screen.getByText(/Checkout →/i)).toBeInTheDocument();
    });
  });

  it('resets conversation when clicking Reset button', () => {
    render(
      <MemoryRouter>
        <ShoppingAssistantWidget />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /open ai shopping assistant/i }));

    const resetBtn = screen.getByRole('button', { name: /reset conversation/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/Conversation reset!/i)).toBeInTheDocument();
  });
});
