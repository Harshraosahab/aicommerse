import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { CartPage } from '../pages/CartPage';
import { WishlistPage } from '../pages/WishlistPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cartApi } from '../services/cartApi';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(),
}));

vi.mock('../services/cartApi', () => ({
  cartApi: {
    getCheckoutSummary: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CartPage Component Tests', () => {
  it('renders sign-in empty state when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(useCart).mockReturnValue({
      cart: null,
      wishlist: null,
      cartCount: 0,
      wishlistCount: 0,
      isLoading: false,
      error: null,
      refreshCart: vi.fn(),
      refreshWishlist: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      clearWishlist: vi.fn(),
      moveWishlistToCart: vi.fn(),
      moveCartToWishlist: vi.fn(),
    });

    renderWithRouter(<CartPage />);
    expect(screen.getByText(/Sign in to view your cart/i)).toBeInTheDocument();
  });

  it('renders cart items, line totals, and controls when authenticated', () => {
    const handleUpdateQuantity = vi.fn();
    const handleRemoveFromCart = vi.fn();

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'USER', addresses: [] } as any,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(useCart).mockReturnValue({
      cart: {
        cartId: 'c1',
        items: [
          {
            _id: 'item-1',
            productId: 'p1',
            name: 'Mechanical Keyboard',
            slug: 'mechanical-keyboard',
            image: '',
            quantity: 2,
            currentPrice: 100,
            priceAtAddition: 100,
            priceChanged: false,
            lineTotal: 200,
            stockAvailable: 10,
            isAvailable: true,
          },
        ],
        itemCount: 2,
        subtotal: 200,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      },
      wishlist: null,
      cartCount: 2,
      wishlistCount: 0,
      isLoading: false,
      error: null,
      refreshCart: vi.fn(),
      refreshWishlist: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: handleUpdateQuantity,
      removeFromCart: handleRemoveFromCart,
      clearCart: vi.fn(),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      clearWishlist: vi.fn(),
      moveWishlistToCart: vi.fn(),
      moveCartToWishlist: vi.fn(),
    });

    renderWithRouter(<CartPage />);

    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument();
    expect(screen.getAllByText('$200.00').length).toBeGreaterThanOrEqual(1);

    const increaseBtn = screen.getByRole('button', { name: /Increase quantity of Mechanical Keyboard/i });
    fireEvent.click(increaseBtn);
    expect(handleUpdateQuantity).toHaveBeenCalledWith('item-1', 3);

    const removeBtn = screen.getByTitle('Remove Item');
    fireEvent.click(removeBtn);
    expect(handleRemoveFromCart).toHaveBeenCalledWith('item-1');
  });
});

describe('WishlistPage Component Tests', () => {
  it('renders wishlist items and triggers move to cart', async () => {
    const handleMoveWishlistToCart = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'USER', addresses: [] } as any,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(useCart).mockReturnValue({
      cart: null,
      wishlist: {
        wishlistId: 'w1',
        items: [
          {
            _id: 'wish-item-1',
            productId: 'p1',
            name: 'Noise Cancelling Headphones',
            slug: 'noise-cancelling-headphones',
            image: '',
            currentPrice: 250,
            stockAvailable: 5,
            isAvailable: true,
            addedAt: new Date().toISOString(),
          },
        ],
        itemCount: 1,
      },
      cartCount: 0,
      wishlistCount: 1,
      isLoading: false,
      error: null,
      refreshCart: vi.fn(),
      refreshWishlist: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      clearWishlist: vi.fn(),
      moveWishlistToCart: handleMoveWishlistToCart,
      moveCartToWishlist: vi.fn(),
    });

    renderWithRouter(<WishlistPage />);

    expect(screen.getByText('Noise Cancelling Headphones')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();

    const moveToCartBtn = screen.getByRole('button', { name: /Add to Cart 🛒/i });
    fireEvent.click(moveToCartBtn);
    expect(handleMoveWishlistToCart).toHaveBeenCalledWith('p1', undefined);
  });
});

describe('CheckoutPage Component Tests', () => {
  it('renders checkout order review and saved delivery addresses', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: {
        _id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'USER',
        addresses: [
          {
            _id: 'addr-1',
            street: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'OR',
            postalCode: '97477',
            country: 'US',
            isDefault: true,
          },
        ],
      } as any,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(useCart).mockReturnValue({
      cart: {
        cartId: 'c1',
        items: [{ _id: 'i1' } as any],
        itemCount: 1,
        subtotal: 150,
        hasUnavailableItems: false,
        hasPriceChanges: false,
      },
      wishlist: null,
      cartCount: 1,
      wishlistCount: 0,
      isLoading: false,
      error: null,
      refreshCart: vi.fn(),
      refreshWishlist: vi.fn(),
      addToCart: vi.fn(),
      updateQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      addToWishlist: vi.fn(),
      removeFromWishlist: vi.fn(),
      clearWishlist: vi.fn(),
      moveWishlistToCart: vi.fn(),
      moveCartToWishlist: vi.fn(),
    });

    vi.mocked(cartApi.getCheckoutSummary).mockResolvedValue({
      success: true,
      data: {
        items: [
          {
            _id: 'item-1',
            productId: 'p1',
            name: 'Studio Monitors',
            slug: 'studio-monitors',
            image: '',
            quantity: 1,
            currentPrice: 150,
            priceAtAddition: 150,
            priceChanged: false,
            lineTotal: 150,
            stockAvailable: 4,
            isAvailable: true,
          },
        ],
        itemCount: 1,
        subtotal: 150,
        shippingFee: 0,
        tax: 0,
        total: 150,
        isReady: true,
        issues: [],
        selectedAddress: {
          _id: 'addr-1',
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zipCode: '97477',
          country: 'US',
          isDefault: true,
        },
      },
    });

    renderWithRouter(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText('742 Evergreen Terrace')).toBeInTheDocument();
      expect(screen.getByText(/Studio Monitors/i)).toBeInTheDocument();
      expect(screen.getByText(/Ready for Order Placement/i)).toBeInTheDocument();
    });
  });
});
