import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Art Journal & Strategy Hive | DreamBeesArt',
  description: 'Deep dives into the world of Artist Trading Cards, TCG strategies, and independent art creation. Insights from the DreamBeesArt hive.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'DreamBeesArt Journal | Art, Strategy & Fandom',
    description: 'Explore our curated editorial hub for collectors and creators.',
    type: 'website',
    images: ['/og-blog.png'],
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
