'use client';

/**
 * [LAYER: UI]
 * Conditionally renders storefront chrome (Navbar + Footer) on non-admin pages.
 * Admin pages have their own dedicated layout shell (AdminLayout).
 */
import { usePathname } from 'next/navigation';
import { Navbar } from '@ui/layouts/Navbar';
import { Footer } from '@ui/layouts/Footer';
import { BottomNav } from '@ui/components/BottomNav';

import { PageProgressBar } from '@ui/animations/PageProgressBar';
import { motion, AnimatePresence } from 'framer-motion';
import { PAGE_TRANSITION_VARIANTS } from '@ui/animations';

export function StorefrontShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');

    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 relative">
            <PageProgressBar />
            <Navbar />
            <AnimatePresence mode="wait">
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
        </div>
    );
}

