import { HomePage } from '@ui/pages/HomePage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DreamBeesArt | The World\'s Favorite Fan Art Marketplace',
    description: 'Shop and discover amazing Artist Trading Cards and Prints. Support independent artists and find your next favorite piece of fan merch.',
    openGraph: {
        title: 'DreamBeesArt | The World\'s Favorite Fan Art Marketplace',
        description: 'Shop and discover amazing Artist Trading Cards and Prints.',
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
