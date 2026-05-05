import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@ui/hooks/useAuth';
import { CartProvider } from '@ui/hooks/useCart';
import { WishlistProvider } from '@ui/hooks/useWishlist';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { StorefrontShell } from '@ui/layouts/StorefrontShell';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from '@utils/seo';
import '../index.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
        template: '%s | DreamBeesArt',
    },
    description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories. Fan art and artist-inspired merch from independent creators you love.',
    keywords: ['Artist Trading Cards', 'ATC', 'TCG Accessories', 'Handmade Art', 'Anime Art Prints', 'TCG Supplies'],
    authors: [{ name: 'DreamBeesArt Team' }],
    creator: 'DreamBeesArt',
    publisher: 'DreamBeesArt',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    icons: {
        icon: '/icon.png',
        shortcut: '/favicon.png',
        apple: '/icon.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: SITE_URL,
        siteName: SITE_NAME,
        title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
        description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories from independent creators.',
        images: [
            {
                url: absoluteUrl(DEFAULT_OG_IMAGE),
                width: 1200,
                height: 630,
                alt: 'DreamBeesArt Storefront',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
        description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories from independent creators.',
        images: [absoluteUrl(DEFAULT_OG_IMAGE)],
        creator: '@DreamBeesArt',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const searchActionLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: 'Dream Bees Art',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <html lang="en" suppressHydrationWarning className={inter.variable}>
            <head>
                <link rel="preconnect" href="https://js.stripe.com" />
                <link rel="dns-prefetch" href="https://js.stripe.com" />
                <link rel="preconnect" href="https://api.stripe.com" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionLd) }}
                />
            </head>
            <body suppressHydrationWarning className={inter.className}>
                <ErrorBoundary>
                    <AuthProvider>
                        <CartProvider>
                            <WishlistProvider>
                                <StorefrontShell>
                                    <div id="main-content">
                                        {children}
                                    </div>
                                </StorefrontShell>
                            </WishlistProvider>
                        </CartProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
