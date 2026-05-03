import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@ui/hooks/useAuth';
import { CartProvider } from '@ui/hooks/useCart';
import { WishlistProvider } from '@ui/hooks/useWishlist';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { StorefrontShell } from '@ui/layouts/StorefrontShell';
import '../index.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
    description: 'Fan art and artist-inspired merch — handcrafted trading cards, art prints, and TCG accessories from independent creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={inter.variable}>
            <head>
                <link rel="preconnect" href="https://js.stripe.com" />
                <link rel="dns-prefetch" href="https://js.stripe.com" />
                <link rel="preconnect" href="https://api.stripe.com" />
            </head>
            <body suppressHydrationWarning className={inter.className}>
                <ErrorBoundary>
                    <AuthProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <StorefrontShell>
                                    {children}
                                </StorefrontShell>
                            </WishlistProvider>
                        </CartProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
