'use client';

/**
 * [LAYER: UI]
 * Conditionally renders storefront chrome (Navbar + Footer) on non-admin pages.
 * Admin pages have their own dedicated layout shell (AdminLayout).
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@ui/layouts/Navbar';
import { Footer } from '@ui/layouts/Footer';
import { BottomNav } from '@ui/components/BottomNav';

import { PageProgressBar } from '@ui/animations/PageProgressBar';
import { motion, AnimatePresence } from 'framer-motion';
import { PAGE_TRANSITION_VARIANTS } from '@ui/animations';

import { useAuth } from '@ui/hooks/useAuth';
import { useCart } from '@ui/hooks/useCart';
import { ConciergeBubble } from '@ui/components/Concierge/ConciergeBubble';

export function StorefrontShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { cart } = useCart();
    const isAdmin = pathname.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    const conciergeContext = {
        userSession: user ? {
            id: user.id,
            email: user.email || '',
            name: user.displayName || undefined
        } : undefined,
        cartContents: cart?.items.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.priceSnapshot
        })) || [],
        shippingPolicy: "Standard shipping is 3-5 business days. Free shipping on orders over $50.",
        returnPolicy: "30-day returns on all physical items. Digital products are non-refundable."
    };

    const isProductPage = pathname.startsWith('/products/');
    const productHandle = isProductPage ? pathname.split('/').pop() : undefined;

    // Scroll to top on pathname change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 relative">
            <PageProgressBar />
            <Navbar />
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.main 
                    key={pathname}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={PAGE_TRANSITION_VARIANTS}
                    className="flex-1 w-full pb-20 lg:pb-0"
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            <Footer />
            <BottomNav />
            <ConciergeBubble 
              initialContext={conciergeContext} 
              productInfo={productHandle ? { name: productHandle.replace(/-/g, ' '), id: productHandle } : undefined}
            />
        </div>
    );
}

