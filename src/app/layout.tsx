import type { Metadata } from 'next';
import { AuthProvider } from '@ui/hooks/useAuth';
import { CartProvider } from '@ui/hooks/useCart';
import { WishlistProvider } from '@ui/hooks/useWishlist';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { StorefrontShell } from '@ui/layouts/StorefrontShell';
import '../index.css';

export const metadata: Metadata = {
    title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
    description: 'Fan art and artist-inspired merch — handcrafted trading cards, art prints, and TCG accessories from independent creators.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
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
