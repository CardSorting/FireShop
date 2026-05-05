import { SupportPage } from '@ui/pages/SupportPage';

export const metadata = {
  title: 'Help & Support | DreamBeesArt',
  description: 'Need help with your order? Visit our support center for FAQs, shipping information, and contact details.',
  alternates: {
    canonical: '/support',
  },
};

import { Suspense } from 'react';

export default function Page() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is your return policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer a 30-day return policy for art prints and TCG accessories. Artist Trading Cards are final sale unless damaged during shipping.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does shipping take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most orders are processed within 24 hours. Domestic shipping typically takes 3-5 business days.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you ship internationally?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we ship to most countries worldwide. International shipping times vary by location.',
        },
      },
    ],
  };

  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Care for Your DreamBeesArt Prints',
    description: 'Professional guide on preserving the quality and longevity of your art prints and collector cards.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Avoid Direct Sunlight',
        text: 'Keep your prints away from windows or high-UV areas to prevent color fading.',
        url: 'https://dreambeesart.com/support#care-sunlight',
      },
      {
        '@type': 'HowToStep',
        name: 'Use Acid-Free Sleeves',
        text: 'For Artist Trading Cards, always use acid-free, archival-safe sleeves to prevent chemical degradation.',
        url: 'https://dreambeesart.com/support#care-sleeves',
      },
      {
        '@type': 'HowToStep',
        name: 'Proper Framing',
        text: 'Use UV-protective glass when framing large prints to ensure maximum preservation.',
        url: 'https://dreambeesart.com/support#care-framing',
      }
    ],
    totalTime: 'PT5M',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <Suspense fallback={<div className="min-h-screen animate-pulse bg-gray-50" />}>
        <SupportPage />
      </Suspense>
    </>
  );
}
