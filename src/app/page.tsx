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
        alternateName: 'Dream Bees Art',
        url: 'https://dreambeesart.com',
        description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://dreambeesart.com/search?q={search_term_string}',
            },
            'query-input': 'required name=search_term_string',
        },
    };

    const organizationLd = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'DreamBeesArt',
        url: 'https://dreambeesart.com',
        logo: 'https://dreambeesart.com/logo.png',
        image: 'https://dreambeesart.com/og-image.png',
        description: 'Boutique art store specializing in Artist Trading Cards and premium TCG accessories.',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '123 Art Lane',
            addressLocality: 'Creative City',
            addressRegion: 'CA',
            postalCode: '90210',
            addressCountry: 'US',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+1-555-0123',
            contactType: 'customer service',
            email: 'hello@dreambeesart.com',
        },
        sameAs: [
            'https://twitter.com/DreamBeesArt',
            'https://instagram.com/DreamBeesArt',
            'https://discord.gg/DreamBeesArt',
            'https://facebook.com/DreamBeesArt',
        ],
        priceRange: '$$',
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
