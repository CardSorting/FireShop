import { HomePage } from '@ui/pages/HomePage';
import type { Metadata } from 'next';
import { absoluteUrl, DEFAULT_OG_IMAGE, organizationJsonLd } from '@utils/seo';

export const metadata: Metadata = {
    title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
    description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories. Fan art and artist-inspired merch from independent creators you love.',
    openGraph: {
        title: 'DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories',
        description: 'Discover handcrafted Artist Trading Cards, stunning art prints, and premium TCG accessories from independent creators.',
        type: 'website',
        url: absoluteUrl('/'),
        images: [absoluteUrl(DEFAULT_OG_IMAGE)],
    },
    alternates: {
        canonical: '/',
    },
};

export default function Page() {
    const organizationLd = organizationJsonLd();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
            />
            <HomePage />
        </>
    );
}
