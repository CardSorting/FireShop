import { SupportPage } from '@ui/pages/SupportPage';

export const metadata = {
  title: 'Support | DreamBeesArt',
};

import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-gray-50" />}>
      <SupportPage />
    </Suspense>
  );
}
