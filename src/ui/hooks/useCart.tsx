'use client';

/**
 * [LAYER: UI]
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Cart, CartItem } from '@domain/models';
import { useAuth } from './useAuth';
import { useServices } from './useServices';
import { logger } from '@utils/logger';
import { MAX_CART_QUANTITY } from '@domain/rules';

export interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = 'DreamBees_guest_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const services = useServices();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Helper to load guest cart from localStorage
  const getGuestCart = useCallback((): Cart | null => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        updatedAt: new Date(parsed.updatedAt)
      };
    } catch {
      return null;
    }
  }, []);

  // Helper to save guest cart to localStorage
  const saveGuestCart = useCallback((updatedCart: Cart | null) => {
    if (typeof window === 'undefined') return;
    if (updatedCart) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  }, []);

  const loadCart = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      if (user) {
        const remoteCart = await services.cartService.getCart(user.id, controller.signal);
        if (controller.signal.aborted || !isMounted.current) return;

        const guestCart = getGuestCart();
        if (guestCart && guestCart.items.length > 0) {
          logger.info('Syncing guest cart with user cart');
          let currentCart = remoteCart;
          for (const item of guestCart.items) {
             currentCart = await services.cartService.addToCart(user.id, item.productId, item.quantity, item.variantId);
             if (controller.signal.aborted || !isMounted.current) return;
          }
          if (isMounted.current && !controller.signal.aborted) {
            setCart(currentCart);
            saveGuestCart(null);
          }
        } else {
          if (isMounted.current && !controller.signal.aborted) {
            setCart(remoteCart);
          }
        }
      } else {
        if (isMounted.current && !controller.signal.aborted) {
          setCart(getGuestCart());
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      logger.error('Failed to load cart', err);
    } finally {
      if (isMounted.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, services.cartService, getGuestCart, saveGuestCart]);

  useEffect(() => {
    void loadCart();
    return () => controllerRef.current?.abort();
  }, [loadCart]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleRefresh = () => void loadCart();
    
    window.addEventListener('cart:open', handleOpen);
    window.addEventListener('cart:refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('cart:open', handleOpen);
      window.removeEventListener('cart:refresh', handleRefresh);
    };
  }, [loadCart]);

  const subtotal = useMemo(() => 
    cart?.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0) ?? 0, 
    [cart]
  );

  const totalItems = useMemo(() => 
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0, 
    [cart]
  );

  const addItem = async (productId: string, quantity: number, variantId?: string) => {
    try {
      if (user) {
        const updated = await services.cartService.addToCart(user.id, productId, quantity, variantId);
        if (isMounted.current) {
          setCart(updated);
        }
      } else {
        // Load product details to mimic server logic
        let product;
        try {
          product = await services.productService.getProduct(productId);
        } catch {
          product = await services.productService.getProducts({}).then(r => r.products.find(p => p.id === productId));
        }
        
        if (!product) throw new Error('Product not found');
        if (!isMounted.current) return;

        let price = product.price;
        let imageUrl = product.imageUrl;
        let variantTitle = undefined;

        if (variantId && product.variants) {
          const v = product.variants.find(varnt => varnt.id === variantId);
          if (v) {
            price = v.price;
            variantTitle = v.title;
            if (v.imageUrl) imageUrl = v.imageUrl;
          }
        }

        const currentCart = getGuestCart() || { id: 'guest', userId: 'guest', items: [], updatedAt: new Date() };
        const existingIndex = currentCart.items.findIndex(i => i.productId === productId && i.variantId === variantId);
        
        if (existingIndex > -1) {
          currentCart.items[existingIndex].quantity = Math.min(currentCart.items[existingIndex].quantity + quantity, MAX_CART_QUANTITY);
        } else {
          currentCart.items.push({
            productId,
            variantId,
            variantTitle,
            name: product.name,
            priceSnapshot: price,
            imageUrl,
            quantity: Math.min(quantity, MAX_CART_QUANTITY)
          });
        }
        currentCart.updatedAt = new Date();
        if (isMounted.current) {
          setCart({ ...currentCart });
          saveGuestCart(currentCart);
        }
      }
      if (isMounted.current) {
        setIsOpen(true);
      }
    } catch (err) {
      logger.error('Failed to add to cart', err);
    }
  };

  const updateQuantity = async (productId: string, quantity: number, variantId?: string) => {
    const safeQuantity = Math.max(1, Math.min(quantity, MAX_CART_QUANTITY));
    
    const prevCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity: safeQuantity } : i)
      });
    }

    try {
      if (user) {
        const updated = await services.cartService.updateQuantity(user.id, productId, safeQuantity, variantId);
        if (isMounted.current) {
          setCart(updated);
        }
      } else {
        const currentCart = getGuestCart();
        if (currentCart) {
          currentCart.items = currentCart.items.map(i => (i.productId === productId && i.variantId === variantId) ? { ...i, quantity: safeQuantity } : i);
          currentCart.updatedAt = new Date();
          if (isMounted.current) {
            setCart({ ...currentCart });
            saveGuestCart(currentCart);
          }
        }
      }
    } catch (err) {
      logger.error('Failed to update quantity', err);
      if (isMounted.current) {
        setCart(prevCart);
      }
    }
  };

  const removeItem = async (productId: string, variantId?: string) => {
    const prevCart = cart;
    if (cart) {
      setCart({
        ...cart,
        items: cart.items.filter(i => !(i.productId === productId && i.variantId === variantId))
      });
    }

    try {
      if (user) {
        const updated = await services.cartService.removeFromCart(user.id, productId, variantId);
        if (isMounted.current) {
          setCart(updated);
        }
      } else {
        const currentCart = getGuestCart();
        if (currentCart) {
          currentCart.items = currentCart.items.filter(i => !(i.productId === productId && i.variantId === variantId));
          currentCart.updatedAt = new Date();
          if (isMounted.current) {
            setCart({ ...currentCart });
            saveGuestCart(currentCart);
          }
        }
      }
    } catch (err) {
      logger.error('Failed to remove item', err);
      if (isMounted.current) {
        setCart(prevCart);
      }
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        await services.cartService.clearCart(user.id);
      }
      if (isMounted.current) {
        setCart(null);
        saveGuestCart(null);
      }
    } catch (err) {
      logger.error('Failed to clear cart', err);
    }
  };

  const value: CartContextValue = {
    cart,
    loading,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
