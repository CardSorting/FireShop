'use client';

/**
 * [LAYER: UI]
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, Package, LogIn, LogOut, Shield, User, Home } from 'lucide-react';
import { useServices } from '../hooks/useServices';

export function Navbar() {
  const { user, signOut } = useAuth();
  const services = useServices();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const cart = await services.cartService.getCart(user.id);
      const count = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, [services, user]);

  useEffect(() => {
    void loadCartCount();
  }, [loadCartCount]);

  useEffect(() => {
    const refresh = () => {
      void loadCartCount();
    };
    window.addEventListener('cart:updated', refresh);
    return () => window.removeEventListener('cart:updated', refresh);
  }, [loadCartCount]);

  const handleSignOut = async () => {
    await signOut();
    setCartCount(0);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl">
            <Package className="w-6 h-6" />
            PlayMoreTCG
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-primary-600 flex items-center gap-1 text-sm">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link href="/products" className="text-gray-600 hover:text-primary-600 text-sm">
              Products
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-primary-600 flex items-center gap-1 text-sm relative">
              <ShoppingCart className="w-4 h-4" />
              Cart
              {user && cartCount > 0 && (
                <span className="ml-1 min-w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] px-1.5 inline-flex items-center justify-center font-semibold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <Link href="/orders" className="text-gray-600 hover:text-primary-600 text-sm">
                  Orders
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.displayName}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}