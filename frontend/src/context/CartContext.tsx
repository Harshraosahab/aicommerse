import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi, CartCalculationResult, WishlistResult } from '../services/cartApi';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartCalculationResult | null;
  wishlist: WishlistResult | null;
  cartCount: number;
  wishlistCount: number;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  addToCart: (productId: string, variantSku?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  addToWishlist: (productId: string, variantSku?: string) => Promise<void>;
  removeFromWishlist: (productId: string, variantSku?: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  moveWishlistToCart: (productId: string, variantSku?: string) => Promise<void>;
  moveCartToWishlist: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartCalculationResult | null>(null);
  const [wishlist, setWishlist] = useState<WishlistResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      const res = await cartApi.getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      // Gracefully handle if cart is empty or network error
      console.warn('Cart refresh:', err.message);
    }
  }, [isAuthenticated]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist(null);
      return;
    }
    try {
      const res = await cartApi.getWishlist();
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err: any) {
      console.warn('Wishlist refresh:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshWishlist();
    } else {
      setCart(null);
      setWishlist(null);
    }
  }, [isAuthenticated, refreshCart, refreshWishlist]);

  const addToCart = async (productId: string, variantSku?: string, quantity: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.addToCart(productId, variantSku, quantity);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.updateCartItem(itemId, quantity);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update item quantity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.removeCartItem(itemId);
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove item from cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.clearCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const addToWishlist = async (productId: string, variantSku?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.addToWishlist(productId, variantSku);
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add to wishlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string, variantSku?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.removeFromWishlist(productId, variantSku);
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove from wishlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearWishlist = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.clearWishlist();
      if (res.success) {
        setWishlist(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear wishlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const moveWishlistToCart = async (productId: string, variantSku?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.moveWishlistItemToCart(productId, variantSku);
      if (res.success) {
        setCart(res.data.cart);
        setWishlist(res.data.wishlist);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move item to cart');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const moveCartToWishlist = async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await cartApi.moveCartItemToWishlist(itemId);
      if (res.success) {
        setCart(res.data);
        await refreshWishlist();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move item to wishlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cartCount = cart ? cart.itemCount : 0;
  const wishlistCount = wishlist ? wishlist.itemCount : 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        wishlistCount,
        isLoading,
        error,
        refreshCart,
        refreshWishlist,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        moveWishlistToCart,
        moveCartToWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
