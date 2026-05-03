import { HomePage } from '@ui/pages/HomePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
    description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories. Fan art and artist-inspired merch from independent creators you love.',
    openGraph: {
        title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
        description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories from independent creators.',
        type: 'website',
        url: 'https://dreambeesart.com',
    },
    alternates: {
        canonical: '/',
    },
};

export default function Page() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'DreamBeesArt',
        url: 'https://dreambeesart.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://dreambeesart.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'DreamBeesArt',
        url: 'https://dreambeesart.com',
        logo: 'https://dreambeesart.com/logo.png',
        sameAs: [
            'https://twitter.com/DreamBeesArt',
            'https://instagram.com/DreamBeesArt',
            'https://discord.gg/DreamBeesArt',
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
            />
            <HomePage />
        </>
    );
}
